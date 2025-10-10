using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TRACKEXPENSES.Server.Models
{
    public class Earning
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required, EmailAddress]
        public string UserEmail { get; set; } = default!;

        public string? UserId { get; set; }

        public string? WalletId { get; set; }
        public Wallet? Wallet { get; set; }

        [MaxLength(140)]
        public string? Title { get; set; }

        [Required, MaxLength(80)]
        public string Category { get; set; } = "Other";

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [MaxLength(3)]
        public string Currency { get; set; } = "EUR";

        [Required]
        public DateTime Date { get; set; } = DateTime.UtcNow.Date;

        public string? Notes { get; set; }
        public string? ImageUrl { get; set; }

        [MaxLength(16)]
        public string Method { get; set; } = "ONE_OFF"; // ONE_OFF | RECURRING

        public int? RepeatEvery { get; set; }          // ex.: 1
        [MaxLength(16)]
        public string? RepeatUnit { get; set; }        // DAY|WEEK|MONTH|YEAR
        public int? Occurrences { get; set; }          // ex.: 12

        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

        public ICollection<EarningInstance> Instances { get; set; } = new List<EarningInstance>();
    }

    public class EarningInstance
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid EarningId { get; set; }

        public Earning Earning { get; set; } = default!;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        // Data esperada de receção (ex.: dia de pagamento)
        public DateTime? ExpectedDate { get; set; }

        // Estado de receção
        public bool IsReceived { get; set; } = false;

        // Quando foi efetivamente recebido (se aplicável)
        public DateTime? ReceivedAtUtc { get; set; }

        // Caminho da imagem desta instância (como nas Expenses)
        public string? ImageUrl { get; set; }
    }

    // DTOs
    public class CreateEarningDto
    {
        [Required, EmailAddress] public string UserEmail { get; set; } = default!;
        [Required] public string WalletId { get; set; } = default!;
        public string? Title { get; set; }
        [Required] public string Category { get; set; } = "Other";
        [Required] public decimal Amount { get; set; }   
        public decimal? PerPeriodAmount { get; set; }               
        public string Currency { get; set; } = "EUR";
        [Required] public DateTime Date { get; set; } = DateTime.UtcNow.Date;
        public string? Notes { get; set; }

        public string Method { get; set; } = "ONE_OFF";
        public int? RepeatEvery { get; set; }
        public string? RepeatUnit { get; set; }
        public int? Occurrences { get; set; }

        public string? SplitMode { get; set; }
    }

    public class UpdateEarningDto
    {
        public string? WalletId { get; set; }
        public string? Title { get; set; }
        public string? Category { get; set; }
        public decimal? Amount { get; set; } 
        public decimal? PerPeriodAmount { get; set; }      
        public string? Currency { get; set; }
        public DateTime? Date { get; set; }
        public string? Notes { get; set; }
        public string? Method { get; set; }
        public int? RepeatEvery { get; set; }
        public string? RepeatUnit { get; set; }
        public int? Occurrences { get; set; }
        public bool RemoveImage { get; set; } = false;

        public string? SplitMode { get; set; }
    }

    public class UpdateEarningInstanceRequest
    {
        public Guid Id { get; set; }
        public DateTime? ExpectedDate { get; set; }
        public bool? IsReceived { get; set; }
        public decimal? Amount { get; set; }
        public DateTime? ReceivedAtUtc { get; set; }
    }

    public class IdDto { public string Id { get; set; } = default!; }
}
