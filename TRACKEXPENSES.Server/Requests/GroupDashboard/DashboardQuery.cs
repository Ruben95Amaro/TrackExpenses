using System;

namespace TRACKEXPENSES.Server.Requests.GroupDashboard
{
    public class DashboardQuery
    {
        public DateTime From { get; set; } = DateTime.UtcNow.AddMonths(-1);
        public DateTime To { get; set; } = DateTime.UtcNow;
        public string? Granularity { get; set; } = "month"; // day | week | month
        public Guid? GroupId { get; set; }
        public Guid? UserId { get; set; }
        public Guid? WalletId { get; set; }
        public string? Type { get; set; } = "both"; // income / expense / both
        public string? GroupBy { get; set; } // usado em StatusSplit
    }
}
