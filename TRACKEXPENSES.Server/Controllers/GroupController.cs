using System.ComponentModel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Extensions;     // GroupQueryExtensions
using TRACKEXPENSES.Server.Models;
using TRACKEXPENSES.Server.Requests.Group;
using TRACKEXPENSES.Server.Requests.User;
using TRACKEXPENSES.Server.Services;

namespace TRACKEXPENSES.Server.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class GroupController(
        ICodeGroupService codeService,
        FinancasDbContext context,
        GroupQueryExtensions groupQuerry,
        UserManager<User> userManager,
        RoleManager<IdentityRole> roleManager
    ) : ControllerBase
    {
        private readonly ICodeGroupService _codeService = codeService;
        private readonly FinancasDbContext _context = context;
        private readonly GroupQueryExtensions _groupQuerry = groupQuerry;
        private readonly UserManager<User> _userManager = userManager;
        private readonly RoleManager<IdentityRole> _roleManager = roleManager;

        /* ----------------------------- helpers ----------------------------- */
        private string? CurrentUserId() => _userManager.GetUserId(User);

        private static object ProjectGroup(Group g, User? admin, IEnumerable<User> users) => new
        {
            g.Id,
            g.Name,
            Admin = admin is null ? null : new
            {
                admin.Id,
                admin.Email,
                FullName = $"{admin.FirstName} {admin.FamilyName}".Trim()
            },
            Members = users
                .Where(u => u.Id != g.AdminId)
                .Select(u => new
                {
                    u.Id,
                    u.Email,
                    FullName = $"{u.FirstName} {u.FamilyName}".Trim()
                })
                .ToList()
        };

        private static object ProjectLite(Group g, bool isAdmin) => new
        {
            id = g.Id,
            name = g.Name,
            isAdmin
        };

        private async Task<bool> IsCurrentUserGroupAdmin(Group g, CancellationToken ct)
        {
            var meId = CurrentUserId();
            if (string.IsNullOrEmpty(meId) || meId != g.AdminId) return false;
            var me = await _userManager.FindByIdAsync(meId);
            if (me == null) return false;
            return await _userManager.IsInRoleAsync(me, "GROUPADMINISTRATOR");
        }

        // Se groupId vier vazio, escolhe um grupo do utilizador (admin tem prioridade).
        private async Task<string?> ResolveGroupIdAsync(string? groupId, CancellationToken ct)
        {
            var meId = CurrentUserId();
            if (string.IsNullOrEmpty(meId)) return null;

            if (!string.IsNullOrWhiteSpace(groupId))
            {
                var belongs = await _context.Groups
                    .AnyAsync(g => g.Id == groupId && (g.AdminId == meId || g.Users.Any(u => u.Id == meId)), ct);
                return belongs ? groupId : null;
            }

            var adminGroup = await _context.Groups
                .AsNoTracking()
                .Where(g => g.AdminId == meId)
                .OrderBy(g => g.Name)
                .Select(g => g.Id)
                .FirstOrDefaultAsync(ct);
            if (!string.IsNullOrEmpty(adminGroup)) return adminGroup;

            var memberGroup = await _context.Groups
                .AsNoTracking()
                .Where(g => g.Users.Any(u => u.Id == meId))
                .OrderBy(g => g.Name)
                .Select(g => g.Id)
                .FirstOrDefaultAsync(ct);

            return memberGroup;
        }

        /* ----------------------------- create/register ----------------------------- */

        [AllowAnonymous]
        [HttpPost("Register")]
        public async Task<IActionResult> Register([FromBody] GroupRegisterRequest req, CancellationToken ct)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            var admin = await _userManager.Users.SingleOrDefaultAsync(u => u.Email == req.AdminEmail, ct);
            if (admin is null) return NotFound("Admin user not found.");

            var group = new Group
            {
                Name = req.GroupName.Trim(),
                AdminId = admin.Id
            };

            var memberIds = (req.UsersId ?? new())
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Select(id => id.Trim())
                .Distinct()
                .Where(id => id != admin.Id)
                .ToList();

            if (memberIds.Count > 0)
            {
                var users = await _userManager.Users
                    .Where(u => memberIds.Contains(u.Id))
                    .ToListAsync(ct);

                foreach (var u in users)
                    group.Users.Add(u);
            }

            if (!group.Users.Any(u => u.Id == admin.Id))
                group.Users.Add(admin);

            _context.Groups.Add(group);

            const string roleName = "GROUPADMINISTRATOR";
            var hasRole = await _userManager.IsInRoleAsync(admin, roleName);
            if (!hasRole)
            {
                var addToRole = await _userManager.AddToRoleAsync(admin, roleName);
                if (!addToRole.Succeeded)
                {
                    var errors = string.Join("; ", addToRole.Errors.Select(e => $"{e.Code}:{e.Description}"));
                    return StatusCode(StatusCodes.Status500InternalServerError,
                        new { message = $"Failed to add admin to role '{roleName}'", errors });
                }
            }

            await _context.SaveChangesAsync(ct);

            return Ok(new
            {
                group.Id,
                group.Name,
                Admin = new { admin.Id, admin.Email, FullName = $"{admin.FirstName} {admin.FamilyName}".Trim() },
                Members = group.Users.Select(u => new { u.Id, u.Email, FullName = $"{u.FirstName} {u.FamilyName}".Trim() })
            });
        }

        /* ----------------------------- code check ----------------------------- */

        [AllowAnonymous]
        [Description("This endpoint allows a user to register or join a group.")]
        [HttpPost("check-code")]
        public async Task<IActionResult> CodeGroupCheck([FromBody] CheckGroupCodeRequest request)
        {
            if (request is null) return BadRequest(new { message = "Request cannot be null." });
            var exists = await _codeService.CheckGroupCodeAsync(request);
            return Ok(exists);
        }

        /* ----------------------------- queries existentes ----------------------------- */

        [AllowAnonymous]
        [HttpPost("GetGroupsByUserEmail")]
        public async Task<IActionResult> GetGroupsByUserEmail([FromBody] UserEmailRequest request)
        {
            var grupos = await _groupQuerry.GetGroupsByUserEmailAsync(request.UserEmail);
            return Ok(grupos);
        }

        [HttpGet("List")]
        public async Task<IActionResult> List([FromQuery] string? email = null, CancellationToken ct = default)
        {
            string? userId;

            if (!string.IsNullOrWhiteSpace(email))
            {
                var normalized = _userManager.NormalizeEmail(email);
                var user = await _userManager.Users
                    .AsNoTracking()
                    .SingleOrDefaultAsync(u => u.NormalizedEmail == normalized, ct);

                if (user is null)
                    return NotFound(new { message = "User not found by email." });

                userId = user.Id;
            }
            else
            {
                userId = CurrentUserId();
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized();
            }

            var data = await _context.Groups
                .AsNoTracking()
                .Where(g => g.AdminId == userId || g.Users.Any(u => u.Id == userId))
                .Select(g => new
                {
                    g.Id,
                    g.Name,
                    Admin = _context.Users
                        .Where(u => u.Id == g.AdminId)
                        .Select(u => new
                        {
                            u.Id,
                            u.Email,
                            FullName = (u.FirstName + " " + u.FamilyName).Trim()
                        })
                        .FirstOrDefault(),

                    Members = g.Users
                        .Where(u => u.Id != g.AdminId)
                        .Select(u => new
                        {
                            u.Id,
                            u.Email,
                            FullName = (u.FirstName + " " + u.FamilyName).Trim()
                        })
                        .ToList()
                })
                .ToListAsync(ct);

            return Ok(data);
        }

        [HttpDelete("Leave")]
        public async Task<IActionResult> LeaveByQuery([FromQuery] string id, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(id))
                return BadRequest(new { message = "id is required." });

            var meId = CurrentUserId();
            if (string.IsNullOrEmpty(meId))
                return Unauthorized();

            var group = await _context.Groups
                .Include(g => g.Users)
                .SingleOrDefaultAsync(g => g.Id == id, ct);

            if (group is null)
                return NotFound(new { message = "Group not found." });

            var isAdmin = group.AdminId == meId;
            var isMember = group.Users.Any(u => u.Id == meId);

            if (!isAdmin && !isMember)
                return NotFound(new { message = "You are not a member of this group." });

            if (isAdmin)
            {
                var otherMembers = group.Users.Any(u => u.Id != meId);
                if (otherMembers)
                    return Conflict(new { message = "Admin cannot leave while there are members. Transfer admin or remove members first." });

                _context.Groups.Remove(group);
                await _context.SaveChangesAsync(ct);
                return Ok(new { deleted = true });
            }

            var me = group.Users.FirstOrDefault(u => u.Id == meId);
            if (me != null) group.Users.Remove(me);

            await _context.SaveChangesAsync(ct);
            return Ok(new { left = true });
        }

        // ========= POST /api/Group/Update?id=&name=&usersId=&usersId= =========
        [HttpPost("Update")]
        public async Task<IActionResult> Update(
            [FromQuery] string id,
            [FromQuery] string name,
            [FromQuery] List<string>? usersId,
            CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(id))
                return BadRequest(new { message = "id is required." });
            if (string.IsNullOrWhiteSpace(name))
                return BadRequest(new { message = "name is required." });

            var g = await _context.Groups
                .Include(x => x.Users)
                .SingleOrDefaultAsync(x => x.Id == id, ct);

            if (g is null) return NotFound(new { message = "Group not found." });

            if (!await IsCurrentUserGroupAdmin(g, ct))
                return Forbid();

            g.Name = name.Trim();

            var incoming = (usersId ?? new())
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Select(s => s.Trim())
                .Distinct()
                .ToHashSet();

            incoming.Add(g.AdminId);

            var existingIds = g.Users.Select(u => u.Id).ToHashSet();
            var toAddIds = incoming.Except(existingIds).ToList();
            var toRemoveIds = existingIds.Except(incoming).Where(uid => uid != g.AdminId).ToList();

            if (toAddIds.Count > 0)
            {
                var addUsers = await _userManager.Users.Where(u => toAddIds.Contains(u.Id)).ToListAsync(ct);
                foreach (var u in addUsers) g.Users.Add(u);
            }
            if (toRemoveIds.Count > 0)
            {
                foreach (var u in g.Users.Where(u => toRemoveIds.Contains(u.Id)).ToList())
                    g.Users.Remove(u);
            }

            await _context.SaveChangesAsync(ct);

            var admin = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == g.AdminId, ct);
            var users = await _context.Users.AsNoTracking()
                .Where(u => g.Users.Select(x => x.Id).Contains(u.Id))
                .ToListAsync(ct);

            return Ok(ProjectGroup(g, admin, users));
        }

        [HttpPost("Edit")]
        public Task<IActionResult> Edit(
            [FromQuery] string id,
            [FromQuery] string name,
            [FromQuery] List<string>? usersId,
            CancellationToken ct = default)
            => Update(id, name, usersId, ct);

        [HttpGet("Get")]
        public async Task<IActionResult> Get([FromQuery] string id, CancellationToken ct = default)
        {
            var g = await _context.Groups
                .AsNoTracking()
                .Include(x => x.Users)
                .SingleOrDefaultAsync(x => x.Id == id, ct);

            if (g is null) return NotFound(new { message = "Group not found." });

            var admin = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == g.AdminId, ct);
            return Ok(new
            {
                g.Id,
                g.Name,
                Admin = admin == null ? null : new { admin.Id, admin.Email, FullName = (admin.FirstName + " " + admin.FamilyName).Trim() },
                Members = g.Users
                    .Where(u => u.Id != g.AdminId)
                    .Select(u => new { u.Id, u.Email, FullName = (u.FirstName + " " + u.FamilyName).Trim() })
                    .ToList()
            });
        }

        private async Task<IActionResult> DeleteInternal(string id, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(id))
                return BadRequest(new { message = "id is required." });

            var g = await _context.Groups
                .Include(x => x.Users)
                .SingleOrDefaultAsync(x => x.Id == id, ct);

            if (g is null) return NotFound(new { message = "Group not found." });

            if (!await IsCurrentUserGroupAdmin(g, ct))
                return Forbid();

            _context.Groups.Remove(g);
            await _context.SaveChangesAsync(ct);
            return NoContent();
        }

        [HttpDelete("Delete")]
        public Task<IActionResult> DeleteByQuery([FromQuery] string id, CancellationToken ct = default)
            => DeleteInternal(id, ct);

        [HttpDelete("{id}")]
        public Task<IActionResult> DeleteByRoute([FromRoute] string id, CancellationToken ct = default)
            => DeleteInternal(id, ct);

        [HttpPost("Delete")]
        public Task<IActionResult> DeleteByPost([FromQuery] string id, CancellationToken ct = default)
            => DeleteInternal(id, ct);

        /* ----------------------------- ALIASES/Compat ----------------------------- */

        // Admin only (formato simples)
        [HttpGet("Admin")]
        [HttpGet("/api/Groups/Admin")]
        [HttpGet("/api/GroupAdmin/MyGroups")]
        public async Task<IActionResult> AdminOnly(CancellationToken ct = default)
        {
            var userId = CurrentUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var list = await _context.Groups
                .AsNoTracking()
                .Where(g => g.AdminId == userId)
                .OrderBy(g => g.Name)
                .ToListAsync(ct);

            return Ok(list.Select(g => ProjectLite(g, isAdmin: true)));
        }

        // Meus grupos (admin OU membro) — formato simples
        [HttpGet("ListMine")]
        [HttpGet("GetMyGroups")]
        [HttpGet("MyGroups")]
        [HttpGet("/api/Groups/ListMine")]
        public async Task<IActionResult> ListMine(CancellationToken ct = default)
        {
            var userId = CurrentUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var list = await _context.Groups
                .AsNoTracking()
                .Where(g => g.AdminId == userId || g.Users.Any(u => u.Id == userId))
                .Select(g => new { g.Id, g.Name, IsAdmin = (g.AdminId == userId) })
                .OrderBy(g => g.Name)
                .ToListAsync(ct);

            return Ok(list.Select(x => new { id = x.Id, name = x.Name, isAdmin = x.IsAdmin }));
        }

        public sealed class GroupIdRequest
        {
            public string? GroupId { get; set; }
        }

        // Implementação comum (aceita groupId vazio -> auto-resolve)
        private async Task<IActionResult> MembersInternal(string? groupId, CancellationToken ct)
        {
            var resolvedId = await ResolveGroupIdAsync(groupId, ct);
            if (string.IsNullOrEmpty(resolvedId))
                return NotFound(new { message = "Group not found or you don't belong to any." });

            var g = await _context.Groups
                .AsNoTracking()
                .Include(x => x.Users)
                .SingleOrDefaultAsync(x => x.Id == resolvedId, ct);

            if (g is null) return NotFound(new { message = "Group not found." });

            var admin = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == g.AdminId, ct);

            var members = new List<object>();
            if (admin != null)
            {
                members.Add(new
                {
                    id = admin.Id,
                    email = admin.Email,
                    fullName = $"{admin.FirstName} {admin.FamilyName}".Trim(),
                    isAdmin = true
                });
            }

            members.AddRange(
                g.Users
                 .Where(u => u.Id != g.AdminId)
                 .Select(u => new
                 {
                     id = u.Id,
                     email = u.Email,
                     fullName = $"{u.FirstName} {u.FamilyName}".Trim(),
                     isAdmin = false
                 })
            );

            return Ok(new { groupId = g.Id, groupName = g.Name, members });
        }

        // GET principal
        [HttpGet("Members")]
        public Task<IActionResult> MembersGet([FromQuery] string? groupId, CancellationToken ct = default)
            => MembersInternal(groupId, ct);

        // POST opcional
        [HttpPost("Members")]
        public Task<IActionResult> MembersPost([FromBody] GroupIdRequest req, CancellationToken ct = default)
            => MembersInternal(req?.GroupId, ct);

        // ALIAS para compat com o front antigo: /api/Users/Members?groupId=
        [HttpGet("/api/Users/Members")]
        public Task<IActionResult> UsersMembersAlias([FromQuery] string? groupId, CancellationToken ct = default)
            => MembersInternal(groupId, ct);

        [Authorize]
        [HttpGet("UserWallets")]
        public async Task<IActionResult> GetUserWallets(
    [FromQuery] string userId,
    [FromQuery] bool includeArchived = false,
    CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(userId))
                return BadRequest(new { message = "userId is required." });

            var exists = await _context.Users.AsNoTracking().AnyAsync(u => u.Id == userId, ct);
            if (!exists) return NotFound(new { message = "User not found." });

            var q = _context.Wallets.AsNoTracking().Where(w => w.UserId == userId);
            if (!includeArchived) q = q.Where(w => !w.IsArchived);

            var list = await q
                .OrderByDescending(w => w.IsPrimary)
                .ThenBy(w => w.Name)
                .Select(w => new { id = w.Id, name = w.Name, currency = w.Currency, isPrimary = w.IsPrimary })
                .ToListAsync(ct);

            return Ok(list);
        }
    }
}
