using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace TRACKEXPENSES.Server.Models
{
    public class Expense
    {
        [Key] public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required, MaxLength(120)] public string Name { get; set; }
        public string? Description { get; set; }
        public decimal Value { get; set; }           
        public decimal? PayAmount { get; set; }      

        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        public int? RepeatCount { get; set; }      
        public bool ShouldNotify { get; set; }
        public string? Periodicity { get; set; }     
        public RecurrenceKind RecurrenceKind { get; set; } = RecurrenceKind.None;
        public string? RRule { get; set; }         

        public string? Category { get; set; }
        public string? ImageId { get; set; }

        [Required] public string UserId { get; set; } 
        public string? GroupId { get; set; }            

        [Required] public string WalletId { get; set; }
        [ForeignKey(nameof(WalletId))] public Wallet Wallet { get; set; }

        public ICollection<ExpenseInstance> Instances { get; set; } = new List<ExpenseInstance>();

        public InstallmentPlan? InstallmentPlan { get; set; }
    }

    public class ExpenseInstance
    {
        [Key] public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required] public string ExpenseId { get; set; }
        [ForeignKey(nameof(ExpenseId))] public Expense Expense { get; set; }

        public DateTime DueDate { get; set; }

        public bool IsPaid { get; set; }
        public decimal Value { get; set; }

        public decimal PaidAmount { get; set; }

        public DateTime? PaidDate { get; set; }

        public string? ImageId { get; set; }
        [ForeignKey(nameof(ImageId))] public ImageDB? Image { get; set; }
    }

   

}
