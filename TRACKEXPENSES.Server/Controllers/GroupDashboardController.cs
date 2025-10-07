using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Linq;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Models;
using TRACKEXPENSES.Server.Requests.GroupDashboard;

namespace TRACKEXPENSES.Server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public sealed class GroupDashboardController : ControllerBase
    {
        private readonly FinancasDbContext _db;
        private readonly UserManager<User> _userManager;

        public GroupDashboardController(FinancasDbContext db, UserManager<User> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        private string? CurrentUserId() => _userManager.GetUserId(User);

        /* =========================== Utils =========================== */

        private static bool TryParseDate(string s, out DateOnly d) =>
            DateOnly.TryParseExact(s, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out d);

        private static IEnumerable<(DateOnly Start, DateOnly End, string Label)> Buckets(DateOnly from, DateOnly to, string g)
        {
            var list = new List<(DateOnly, DateOnly, string)>();
            var cur = from;

            if (string.Equals(g, "day", StringComparison.OrdinalIgnoreCase))
            {
                while (cur <= to) { list.Add((cur, cur, cur.ToString("dd/MM"))); cur = cur.AddDays(1); }
            }
            else if (string.Equals(g, "week", StringComparison.OrdinalIgnoreCase))
            {
                while (cur <= to)
                {
                    int diff = (7 + (cur.DayOfWeek - DayOfWeek.Monday)) % 7;
                    var start = cur.AddDays(-diff);
                    var end = start.AddDays(6);
                    if (end > to) end = to;
                    var iso = ISOWeek.GetWeekOfYear(start.ToDateTime(TimeOnly.MinValue));
                    list.Add((start, end, $"W{iso}"));
                    cur = end.AddDays(1);
                }
            }
            else
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

        // filtros NULL-safe
        private static IQueryable<EarningInstance> FilterEarningsSafe(
            IQueryable<EarningInstance> q, HashSet<string>? walletIds, DateOnly from, DateOnly to)
        {
            var d1 = from.ToDateTime(TimeOnly.MinValue);
            var d2 = to.ToDateTime(TimeOnly.MaxValue);

            if (walletIds is { Count: > 0 })
                q = q.Where(i => i.Earning != null && i.Earning.WalletId != null && walletIds.Contains(i.Earning.WalletId));

            return q.Where(i => ((i.ExpectedDate ?? i.Earning!.Date) >= d1) && ((i.ExpectedDate ?? i.Earning!.Date) <= d2));
        }

        private static IQueryable<ExpenseInstance> FilterExpensesSafe(
            IQueryable<ExpenseInstance> q, HashSet<string>? walletIds, DateOnly from, DateOnly to)
        {
            var d1 = from.ToDateTime(TimeOnly.MinValue);
            var d2 = to.ToDateTime(TimeOnly.MaxValue);

            if (walletIds is { Count: > 0 })
                q = q.Where(i => i.Expense != null && i.Expense.WalletId != null && walletIds.Contains(i.Expense.WalletId));

            return q.Where(i => i.DueDate >= d1 && i.DueDate <= d2);
        }

        private async Task<HashSet<string>> ResolveWalletFilterAsync(
            Guid? groupId, Guid? userId, Guid? walletId, CancellationToken ct)
        {
            // 1) Se veio walletId → só essa
            if (walletId.HasValue)
                return new HashSet<string>(new[] { walletId.Value.ToString() });

            // 2) Se veio userId → todas as wallets (ativas) desse user
            if (userId.HasValue)
            {
                var ws = await _db.Wallets.AsNoTracking()
                    .Where(w => w.UserId == userId.Value.ToString() && !w.IsArchived)
                    .Select(w => w.Id)                 // Id já é string
                    .ToListAsync(ct);

                return ws.ToHashSet();
            }

            // 3) Se veio groupId → wallets (ativas) de admin + membros
            if (groupId.HasValue)
            {
                var gid = groupId.Value.ToString();

                var userIds = await _db.Groups.AsNoTracking()
                    .Where(g => g.Id == gid)
                    .SelectMany(g =>
                        g.Users.Select(u => u.Id)
                        .Concat(!string.IsNullOrEmpty(g.AdminId)
                            ? new string[] { g.AdminId! }          // <— tipos explícitos
                            : Array.Empty<string>()))
                    .Distinct()
                    .ToListAsync(ct);

                if (userIds.Count == 0)
                    return new HashSet<string>();

                var ws = await _db.Wallets.AsNoTracking()
                    .Where(w => userIds.Contains(w.UserId) && !w.IsArchived)
                    .Select(w => w.Id)
                    .ToListAsync(ct);

                return ws.ToHashSet();
            }

            // 4) Fallback: utilizador corrente
            var me = _userManager.GetUserId(User);
            if (!string.IsNullOrEmpty(me))
            {
                var ws = await _db.Wallets.AsNoTracking()
                    .Where(w => w.UserId == me && !w.IsArchived)
                    .Select(w => w.Id)
                    .ToListAsync(ct);

                return ws.ToHashSet();
            }

            return new HashSet<string>();
        }



        /* =========================== DTOs mínimos =========================== */

        public record WalletMin(string id, string name);
        public record UserLite(string id, string email, string fullName, List<WalletMin> wallets);
        public record GroupLite(string id, string name, List<UserLite> users);

        /* =========================== 1) Grupos / Users / Wallets =========================== */

        /// <summary>Grupos onde sou admin ou membro, com utilizadores e wallets (não arquivadas).</summary>
        [HttpGet("GroupsMine")]
        public async Task<IActionResult> GroupsMine(CancellationToken ct)
        {
            var me = CurrentUserId();
            if (string.IsNullOrEmpty(me)) return Unauthorized();

            var groups = await _db.Groups.AsNoTracking()
                .Include(g => g.Users)
                .Where(g => g.AdminId == me || g.Users.Any(u => u.Id == me))
                .OrderBy(g => g.Name)
                .ToListAsync(ct);

            var allUserIds = groups
                .SelectMany(g => g.Users.Select(u => u.Id).Append(g.AdminId))
                .Where(id => id != null)
                .Distinct()
                .ToList();

            var usersLite = await _db.Users.AsNoTracking()
                .Where(u => allUserIds.Contains(u.Id))
                .Select(u => new
                {
                    id = u.Id,
                    email = u.Email ?? "",
                    fullName = ((u.FirstName ?? "") + " " + (u.FamilyName ?? "")).Trim()
                })
                .ToListAsync(ct);
            var userInfo = usersLite.ToDictionary(x => x.id, x => (x.email, x.fullName));

            var walletsByUser = await _db.Wallets.AsNoTracking()
                .Where(w => allUserIds.Contains(w.UserId) && !w.IsArchived)
                .GroupBy(w => w.UserId)
                .Select(g => new { userId = g.Key!, wallets = g.Select(w => new WalletMin(w.Id, w.Name)).ToList() })
                .ToListAsync(ct);
            var walletsDict = walletsByUser.ToDictionary(x => x.userId, x => x.wallets);

            var payload = groups.Select(g =>
            {
                var users = g.Users
                    .Select(u =>
                    {
                        var (email, fullName) = userInfo.TryGetValue(u.Id, out var v) ? v : ("", "");
                        var ws = walletsDict.TryGetValue(u.Id, out var list) ? list : new List<WalletMin>();
                        return new UserLite(u.Id, email, fullName, ws);
                    })
                    .Concat(string.IsNullOrWhiteSpace(g.AdminId)
                        ? Enumerable.Empty<UserLite>()
                        : new[]
                        {
                            new UserLite(
                                g.AdminId,
                                userInfo.TryGetValue(g.AdminId, out var v) ? v.email : "",
                                userInfo.TryGetValue(g.AdminId, out v) ? v.fullName : "",
                                walletsDict.TryGetValue(g.AdminId, out var wsAdmin) ? wsAdmin : new List<WalletMin>())
                        })
                    .GroupBy(u => u.id).Select(grp => grp.First())
                    .OrderBy(u => u.fullName)
                    .ToList();

                return new GroupLite(g.Id, g.Name, users);
            });

            return Ok(payload);
        }

        [HttpGet("UsersByGroup")]
        public async Task<IActionResult> UsersByGroup([FromQuery] string groupId, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(groupId))
                return BadRequest(new { message = "groupId is required." });

            var g = await _db.Groups.AsNoTracking().Include(x => x.Users)
                .SingleOrDefaultAsync(x => x.Id == groupId, ct);

            if (g is null) return NotFound(new { message = "Group not found." });

            var userIds = g.Users.Select(u => u.Id)
                .Concat(string.IsNullOrWhiteSpace(g.AdminId) ? Array.Empty<string>() : new[] { g.AdminId })
                .Distinct()
                .ToList();

            var usersLite = await _db.Users.AsNoTracking()
                .Where(u => userIds.Contains(u.Id))
                .Select(u => new
                {
                    id = u.Id,
                    email = u.Email ?? "",
                    fullName = ((u.FirstName ?? "") + " " + (u.FamilyName ?? "")).Trim()
                })
                .OrderBy(x => x.fullName)
                .ToListAsync(ct);

            return Ok(new { groupId = g.Id, groupName = g.Name, users = usersLite });
        }

        /// <summary>Wallets (não arquivadas) de um utilizador.</summary>
        [HttpGet("WalletsByUser")]
        public async Task<IActionResult> WalletsByUser([FromQuery] string userId, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(userId))
                return BadRequest(new { message = "userId is required." });

            var wallets = await _db.Wallets.AsNoTracking()
                .Where(w => w.UserId == userId && !w.IsArchived)   // <- sem '??' em bool
                .OrderByDescending(w => w.IsPrimary)
                .ThenBy(w => w.Name)
                .Select(w => new WalletMin(w.Id, w.Name))
                .ToListAsync(ct);

            return Ok(wallets);
        }

        /* =========================== 2) KPIs / Charts =========================== */

        // /api/GroupDashboard/Summary?from=yyyy-MM-dd&to=yyyy-MM-dd&granularity=month&groupId=&userId=&walletId=
        [HttpGet("Summary")]
        public async Task<IActionResult> Summary([FromQuery] DashboardQuery q, CancellationToken ct = default)
        {
            var dFrom = DateOnly.FromDateTime(q.From.Date);
            var dTo = DateOnly.FromDateTime(q.To.Date);

            var walletIds = await ResolveWalletFilterAsync(q.GroupId, q.UserId, q.WalletId, ct);

            var ei = FilterEarningsSafe(_db.EarningInstances.AsNoTracking().Include(i => i.Earning), walletIds, dFrom, dTo);
            var xi = FilterExpensesSafe(_db.ExpenseInstances.AsNoTracking().Include(i => i.Expense), walletIds, dFrom, dTo);

            var incExpected = await ei.SumAsync(i => (decimal?)i.Amount, ct) ?? 0m;
            var incReceived = await ei.Where(i => i.IsReceived || i.ReceivedAtUtc != null)
                                      .SumAsync(i => (decimal?)i.Amount, ct) ?? 0m;

            var expExpected = await xi.SumAsync(i => (decimal?)i.Value, ct) ?? 0m;
            var expPaid = await xi.SumAsync(i => (decimal?)i.PaidAmount, ct) ?? 0m;

            return Ok(new
            {
                totalIncome = incReceived,
                totalExpense = expPaid,
                net = incReceived - expPaid,
                pctIncomeReceived = incExpected == 0 ? 1.0 : (double)(incReceived / incExpected),
                pctExpensePaid = expExpected == 0 ? 1.0 : (double)(expPaid / expExpected)
            });
        }

        [HttpGet("TimeSeries")]
        public async Task<IActionResult> TimeSeries([FromQuery] DashboardQuery q, CancellationToken ct = default)
        {
            var dFrom = DateOnly.FromDateTime(q.From.Date);
            var dTo = DateOnly.FromDateTime(q.To.Date);

            var walletIds = await ResolveWalletFilterAsync(q.GroupId, q.UserId, q.WalletId, ct);
            var buckets = Buckets(dFrom, dTo, q.Granularity).ToList();

            var data = new List<object>(buckets.Count);
            foreach (var b in buckets)
            {
                var ei = FilterEarningsSafe(_db.EarningInstances.AsNoTracking().Include(i => i.Earning), walletIds, b.Start, b.End)
                    .Where(i => i.IsReceived || i.ReceivedAtUtc != null);
                var xi = FilterExpensesSafe(_db.ExpenseInstances.AsNoTracking().Include(i => i.Expense), walletIds, b.Start, b.End);

                var inc = await ei.SumAsync(i => (decimal?)i.Amount, ct) ?? 0m;
                var exp = await xi.SumAsync(i => (decimal?)i.PaidAmount, ct) ?? 0m;

                data.Add(new { label = b.Label, income = inc, expense = exp });
            }

            return Ok(data);
        }

        [HttpGet("StatusSplit")]
        public async Task<IActionResult> StatusSplit([FromQuery] DashboardQuery q, CancellationToken ct = default)
        {
            var dFrom = DateOnly.FromDateTime(q.From.Date);
            var dTo = DateOnly.FromDateTime(q.To.Date);

            var walletIds = await ResolveWalletFilterAsync(q.GroupId, q.UserId, q.WalletId, ct);
            var buckets = Buckets(dFrom, dTo, q.Granularity).ToList();

            var result = new List<object>(buckets.Count);
            foreach (var b in buckets)
            {
                var ei = FilterEarningsSafe(_db.EarningInstances.AsNoTracking().Include(i => i.Earning), walletIds, b.Start, b.End);
                var xi = FilterExpensesSafe(_db.ExpenseInstances.AsNoTracking().Include(i => i.Expense), walletIds, b.Start, b.End);

                var incomeReceived = await ei.Where(i => i.IsReceived || i.ReceivedAtUtc != null)
                                             .SumAsync(i => (decimal?)i.Amount, ct) ?? 0m;
                var incomePending = await ei.Where(i => !(i.IsReceived || i.ReceivedAtUtc != null))
                                             .SumAsync(i => (decimal?)i.Amount, ct) ?? 0m;

                var expensesPaid = await xi.SumAsync(i => (decimal?)i.PaidAmount, ct) ?? 0m;
                var expensesPending = await xi.SumAsync(i => (decimal?)(i.Value - i.PaidAmount), ct) ?? 0m;
                if (expensesPending < 0) expensesPending = 0;

                result.Add(new
                {
                    label = b.Label,
                    incomeReceived,
                    incomePending,
                    expensesPaid,
                    expensesPending
                });
            }

            return Ok(result);
        }

        [HttpGet("Categories")]
        public async Task<IActionResult> Categories([FromQuery] DashboardQuery q, CancellationToken ct = default)
        {
            var dFrom = DateOnly.FromDateTime(q.From.Date);
            var dTo = DateOnly.FromDateTime(q.To.Date);

            var walletIds = await ResolveWalletFilterAsync(q.GroupId, q.UserId, q.WalletId, ct);

            if (string.Equals(q.Type, "income", StringComparison.OrdinalIgnoreCase))
            {
                var data = await FilterEarningsSafe(_db.EarningInstances.AsNoTracking().Include(i => i.Earning), walletIds, dFrom, dTo)
                    .Where(i => i.IsReceived || i.ReceivedAtUtc != null)
                    .GroupBy(i => i.Earning!.Category ?? "—")
                    .Select(g => new { category = g.Key, amount = g.Sum(x => x.Amount) })
                    .OrderByDescending(x => x.amount)
                    .ToListAsync(ct);
                return Ok(data);
            }

            if (string.Equals(q.Type, "expense", StringComparison.OrdinalIgnoreCase))
            {
                var data = await FilterExpensesSafe(_db.ExpenseInstances.AsNoTracking().Include(i => i.Expense), walletIds, dFrom, dTo)
                    .GroupBy(i => i.Expense!.Category ?? "—")
                    .Select(g => new { category = g.Key, amount = g.Sum(x => x.PaidAmount) })
                    .OrderByDescending(x => x.amount)
                    .ToListAsync(ct);
                return Ok(data);
            }

            return BadRequest(new { message = "type must be 'income' or 'expense'." });
        }

        [HttpGet("WalletBalances")]
        public async Task<IActionResult> WalletBalances([FromQuery] DashboardQuery q, [FromQuery] int take = 12, CancellationToken ct = default)
        {
            var dFrom = DateOnly.FromDateTime(q.From.Date);
            var dTo = DateOnly.FromDateTime(q.To.Date);

            var walletIds = await ResolveWalletFilterAsync(q.GroupId, q.UserId, q.WalletId, ct);

            var inc = await FilterEarningsSafe(
                        _db.EarningInstances.AsNoTracking().Include(i => i.Earning).ThenInclude(e => e.Wallet),
                        walletIds, dFrom, dTo)
                .Where(i => i.IsReceived || i.ReceivedAtUtc != null)
                .Where(i => i.Earning!.WalletId != null)
                .GroupBy(i => new { i.Earning!.WalletId, i.Earning!.Wallet!.Name })
                .Select(g => new { walletId = g.Key.WalletId!, name = g.Key.Name, amount = g.Sum(x => x.Amount) })
                .ToListAsync(ct);

            var exp = await FilterExpensesSafe(
                        _db.ExpenseInstances.AsNoTracking().Include(i => i.Expense).ThenInclude(e => e.Wallet),
                        walletIds, dFrom, dTo)
                .Where(i => i.Expense!.WalletId != null)
                .GroupBy(i => new { i.Expense!.WalletId, i.Expense!.Wallet!.Name })
                .Select(g => new { walletId = g.Key.WalletId!, name = g.Key.Name, amount = g.Sum(x => x.PaidAmount) })
                .ToListAsync(ct);

            var allIds = inc.Select(x => x.walletId).Union(exp.Select(x => x.walletId)).Distinct();

            var result = allIds
                .Select(id => new
                {
                    walletId = id,
                    walletName = inc.FirstOrDefault(x => x.walletId == id)?.name
                               ?? exp.FirstOrDefault(x => x.walletId == id)?.name
                               ?? "—",
                    balance = (inc.FirstOrDefault(x => x.walletId == id)?.amount ?? 0m)
                            - (exp.FirstOrDefault(x => x.walletId == id)?.amount ?? 0m)
                })
                .OrderByDescending(x => x.balance)
                .Take(take)
                .ToList();

            return Ok(result);
        }
    }
}
