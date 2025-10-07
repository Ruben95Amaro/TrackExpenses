using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Models;

namespace TRACKEXPENSES.Server.Controllers
{
    [ApiController]
    [Route("api/Administrator")]
    [Authorize(Roles = "ADMINISTRATOR")]
    public class AdministrationController : ControllerBase
    {
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly UserManager<User> _userManager;
        private readonly FinancasDbContext _context;

        public AdministrationController(
            RoleManager<IdentityRole> roleManager,
            UserManager<User> userManager,
            FinancasDbContext context)
        {
            _roleManager = roleManager;
            _userManager = userManager;
            _context = context;
        }

        [HttpGet("User/GetAllUsers")]
        public IActionResult ListClients()
        {
            var allClients = _context.Users
                .Include(u => u.Groups)
                .ToList();

            if (allClients is null || allClients.Count == 0)
                return NotFound("Nenhum utilizador encontrado.");

            return Ok(new { ListUsers = allClients });
        }

        [HttpPost("User/DeleteUser")]
        public async Task<IActionResult> DeleteUser([FromBody] string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                return BadRequest("ID do utilizador inválido.");

            var user = await _context.Users
                .Include(u => u.Expenses)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return NotFound("Utilizador não encontrado.");

            if (user.Expenses?.Count > 0)
            {
                _context.Expenses.RemoveRange(user.Expenses);
                await _context.SaveChangesAsync();
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok("Utilizador eliminado com sucesso.");
        }

        [HttpGet("GetAllGroupsNames")]
        public IActionResult GetAllGroupsNames()
        {
            var groups = _context.GroupOfUsers.ToList();
            return Ok(new { GroupNames = groups });
        }
    }
}
