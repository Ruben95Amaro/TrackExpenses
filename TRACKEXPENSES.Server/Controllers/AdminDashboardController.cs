using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Models;

namespace TRACKEXPENSES.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminDashboardController : ControllerBase
    {
        private readonly FinancasDbContext _db;
        public AdminDashboardController(FinancasDbContext db) => _db = db;

        /* ---------------- helpers ---------------- */
        private static bool TryParseDate(string? s, out DateOnly d)
        {
            if (!string.IsNullOrWhiteSpace(s) &&
                DateOnly.TryParseExact(s, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var x))
            { d = x; return true; }
            d = default; return false;
        }

        private static IEnumerable<(DateOnly Start, DateOnly End, string Label)> Buckets(DateOnly from, DateOnly to, string g)
        {
            var list = new List<(DateOnly, DateOnly, string)>();
            var cur = from;

            if (g == "day")
            {
                while (cur <= to)
                {
                    list.Add((cur, cur, cur.ToString("dd/MM")));
                    cur = cur.AddDays(1);
                }
            }
            else if (g == "week")
            {
                while (cur <= to)
                {
                    int diff = (7 + (cur.DayOfWeek - DayOfWeek.Monday)) % 7;
                    var start = cur.AddDays(-diff);
                    var end = start.AddDays(6);
                    if (end > to) end = to;
                    list.Add((start, end, $"W{ISOWeek.GetWeekOfYear(start.ToDateTime(TimeOnly.MinValue))}"));
                    cur = end.AddDays(1);
                }
            }
            else // month
            {
                while (cur <= to)
                {
                    var start = new DateOnly(cur.Year, cur.Month, 1);
                    var end = start.AddMonths(1).AddDays(-1);
                    if (end > to) end = to;
                    list.Add((start, end, start.ToString("MM/yyyy")));
                    cur = end.AddDays(1);
                }
            }
            return list;
        }

        private IQueryable<EarningInstance> EarningsScope(DateOnly from, DateOnly to, Guid? userId, Guid? walletId)
        {
            string? uidStr = userId?.ToString();
            string? widStr = walletId?.ToString();

            var q = _db.EarningInstances
                .Include(i => i.Earning).ThenInclude(e => e.Wallet)
                .Where(i => (i.ExpectedDate ?? i.Earning.Date) >= from.ToDateTime(TimeOnly.MinValue)
                         && (i.ExpectedDate ?? i.Earning.Date) <= to.ToDateTime(TimeOnly.MaxValue));

            if (!string.IsNullOrEmpty(widStr)) q = q.Where(i => i.Earning.WalletId == widStr);
            if (!string.IsNullOrEmpty(uidStr)) q = q.Where(i => i.Earning.Wallet.UserId == uidStr);
            return q;
        }

        private IQueryable<ExpenseInstance> ExpensesScope(DateOnly from, DateOnly to, Guid? userId, Guid? walletId)
        {
            string? uidStr = userId?.ToString();
            string? widStr = walletId?.ToString();

            var q = _db.ExpenseInstances
                .Include(i => i.Expense).ThenInclude(e => e.Wallet)
                .Where(i => i.DueDate >= from.ToDateTime(TimeOnly.MinValue)
                         && i.DueDate <= to.ToDateTime(TimeOnly.MaxValue));

            if (!string.IsNullOrEmpty(widStr)) q = q.Where(i => i.Expense.WalletId == widStr);
            if (!string.IsNullOrEmpty(uidStr)) q = q.Where(i => i.Expense.Wallet.UserId == uidStr);
            return q;
        }

        /* ---------------- endpoints ---------------- */

        [HttpGet("Summary")]
        public async Task<IActionResult> Summary(
            [FromQuery] string from,
            [FromQuery] string to,
            [FromQuery] Guid? userId = null,
            [FromQuery] Guid? walletId = null)
        {
            if (!TryParseDate(from, out var df) || !TryParseDate(to, out var dt))
                return BadRequest("Formato de data inválido. Usa yyyy-MM-dd.");

            var ei = EarningsScope(df, dt, userId, walletId);
            var xi = ExpensesScope(df, dt, userId, walletId);

            var incExpected = await ei.SumAsync(i => (decimal?)i.Amount) ?? 0m;
            var incReceived = await ei.Where(i => i.IsReceived || i.ReceivedAtUtc != null).SumAsync(i => (decimal?)i.Amount) ?? 0m;

            var expExpected = await xi.SumAsync(i => (decimal?)i.Value) ?? 0m;
            var expPaid = await xi.SumAsync(i => (decimal?)i.PaidAmount) ?? 0m;

            var usersActive = await _db.Wallets.Select(w => w.UserId).Distinct().CountAsync();
            var groupsCount = await _db.Set<Group>().CountAsync();
            var walletsAct = await _db.Wallets.Where(w => !w.IsArchived).CountAsync();

            return Ok(new
            {
                currency = "EUR",
                totalIncome = incReceived,
                totalExpense = expPaid,
                net = incReceived - expPaid,
                pctIncomeReceived = incExpected == 0 ? 1 : (double)(incReceived / incExpected),
                pctExpensePaid = expExpected == 0 ? 1 : (double)(expPaid / expExpected),
                usersActive,
                groupsCount,
                walletsActive = walletsAct
            });
        }

        [HttpGet("TimeSeries")]
        public async Task<IActionResult> TimeSeries(
            [FromQuery] string from,
            [FromQuery] string to,
            [FromQuery] string granularity = "month",
            [FromQuery] Guid? userId = null,
            [FromQuery] Guid? walletId = null)
        {
            if (!TryParseDate(from, out var df) || !TryParseDate(to, out var dt))
                return BadRequest("Formato de data inválido. Usa yyyy-MM-dd.");

            var data = new List<object>();

            foreach (var b in Buckets(df, dt, granularity))
            {
                var inc = await EarningsScope(b.Start, b.End, userId, walletId)
                            .Where(i => i.IsReceived || i.ReceivedAtUtc != null)
                            .SumAsync(i => (decimal?)i.Amount) ?? 0m;

                var exp = await ExpensesScope(b.Start, b.End, userId, walletId)
                            .SumAsync(i => (decimal?)i.PaidAmount) ?? 0m;

                data.Add(new { label = b.Label, income = inc, expense = exp });
            }

            return Ok(data);
        }

        [HttpGet("StatusSplit")]
        public async Task<IActionResult> StatusSplit(
            [FromQuery] string from,
            [FromQuery] string to,
            [FromQuery(Name = "granularity")] string groupBy = "month",
            [FromQuery] string type = "income",
            [FromQuery] Guid? userId = null,
            [FromQuery] Guid? walletId = null)
        {
            if (!TryParseDate(from, out var df) || !TryParseDate(to, out var dt))
                return BadRequest("Formato de data inválido. Usa yyyy-MM-dd.");

            var data = new List<object>();
            foreach (var b in Buckets(df, dt, groupBy))
            {
                if (type.Equals("income", StringComparison.OrdinalIgnoreCase))
                {
                    var scope = EarningsScope(b.Start, b.End, userId, walletId);
                    var expected = await scope.SumAsync(i => (decimal?)i.Amount) ?? 0m;
                    var received = await scope.Where(i => i.IsReceived || i.ReceivedAtUtc != null)
                                              .SumAsync(i => (decimal?)i.Amount) ?? 0m;
                    data.Add(new { label = b.Label, expected, received, pending = expected - received });
                }
                else
                {
                    var scope = ExpensesScope(b.Start, b.End, userId, walletId);
                    var expected = await scope.SumAsync(i => (decimal?)i.Value) ?? 0m;
                    var paid = await scope.SumAsync(i => (decimal?)i.PaidAmount) ?? 0m;
                    data.Add(new { label = b.Label, expected, paid, pending = expected - paid });
                }
            }

            return Ok(data);
        }

        [HttpGet("Categories")]
        public async Task<IActionResult> Categories(
            [FromQuery] string from,
            [FromQuery] string to,
            [FromQuery] string type = "income",
            [FromQuery] Guid? userId = null,
            [FromQuery] Guid? walletId = null)
        {
            if (!TryParseDate(from, out var df) || !TryParseDate(to, out var dt))
                return BadRequest("Formato de data inválido. Usa yyyy-MM-dd.");

            if (type.Equals("income", StringComparison.OrdinalIgnoreCase))
            {
                var q = await EarningsScope(df, dt, userId, walletId)
                    .Where(i => i.IsReceived || i.ReceivedAtUtc != null)
                    .Include(i => i.Earning)
                    .GroupBy(i => i.Earning.Category)
                    .Select(g => new { category = g.Key, amount = g.Sum(x => x.Amount) })
                    .OrderByDescending(x => x.amount)
                    .ToListAsync();

                return Ok(q);
            }
            else
            {
                var q = await ExpensesScope(df, dt, userId, walletId)
                    .Include(i => i.Expense)
                    .GroupBy(i => i.Expense.Category!)
                    .Select(g => new { category = g.Key, amount = g.Sum(x => x.PaidAmount) })
                    .OrderByDescending(x => x.amount)
                    .ToListAsync();

                return Ok(q);
            }
        }
    }
}
