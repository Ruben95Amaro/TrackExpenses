using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using System.Text;
using System.Text.Json.Serialization;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Extensions;
using TRACKEXPENSES.Server.Services;
using TRACKEXPENSES.Server.Services.Expenses;
using TRACKEXPENSES.Server.Services.Subscription;



var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<FinancasDbContext>(options =>
{
    options.UseSqlServer(connectionString);
});

builder.Services.AddIdentityServices();
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
builder.Services.AddAuthentications(jwtSettings);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("https://localhost:64306") // Porta do front-end
             .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials(); 
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Evita $id/$ref e quebra os ciclos silenciosamente
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;

        // Mantém PascalCase como o front espera
        options.JsonSerializerOptions.PropertyNamingPolicy = null;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;

        // (Opcional) não enviar propriedades null
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;

        // (Opcional) só para DEV; em produção, desliga para reduzir payload
        options.JsonSerializerOptions.WriteIndented = true;
    });


builder.Services.Configure<SmtpOptions>(
    builder.Configuration.GetSection("Smtp"));
builder.Services.Configure<PremiumOptions>(builder.Configuration.GetSection("Premium"));
builder.Services.AddScoped<TRACKEXPENSES.Server.Services.IEmailSender, SmtpEmailSender>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddAuthorization();
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<ICodeGroupService, CodeGroupService>();
builder.Services.AddScoped<GroupQueryExtensions>();
builder.Services.AddScoped<ISubscriptionProvider, ClaimsSubscriptionProvider>();

builder.Services.AddScoped<IPremiumService, PremiumService>();

var app = builder.Build();
app.UseDefaultFiles();

//Set FileProvider to Client APP (AKA front)
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "Images")),
    RequestPath = "/Images"
});

if (app.Environment.IsDevelopment())
{
    await using (var serviceScope = app.Services.CreateAsyncScope())
    await using (var dbContext = serviceScope.ServiceProvider.GetRequiredService<FinancasDbContext>())
    {
        await dbContext.Database.EnsureCreatedAsync();
    }

    app.UseSwagger();
    app.UseSwaggerUI();

    app.UseDeveloperExceptionPage(); 
}

app.UseCors("AllowFrontend");

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();


await app.SetRoles();
await app.SetAdmin();
await app.SetCategories();
app.Run();