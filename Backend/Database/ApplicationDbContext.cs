using Microsoft.EntityFrameworkCore;
using Pickleball.College.Models.Entities;

namespace Pickleball.College.Database;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<CoachProfile> CoachProfiles { get; set; }
    public DbSet<TrainingMaterial> TrainingMaterials { get; set; }
    public DbSet<MaterialPurchase> MaterialPurchases { get; set; }
    public DbSet<TrainingSession> TrainingSessions { get; set; }

    // Theme and Asset Management
    public DbSet<ThemeSettings> ThemeSettings { get; set; }
    public DbSet<ThemePreset> ThemePresets { get; set; }
    public DbSet<ActivityLog> ActivityLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.Role).HasConversion<string>();
        });

        modelBuilder.Entity<TrainingMaterial>(entity =>
        {
            entity.HasOne(tm => tm.Coach)
                  .WithMany(u => u.TrainingMaterials)
                  .HasForeignKey(tm => tm.CoachId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.Property(tm => tm.ContentType).HasConversion<string>();
        });

        modelBuilder.Entity<TrainingSession>(entity =>
        {
            entity.Property(ts => ts.SessionType).HasConversion<string>();
            entity.Property(ts => ts.Status).HasConversion<string>();
            
            entity.HasOne(ts => ts.Coach)
                  .WithMany(u => u.CoachingSessions)
                  .HasForeignKey(ts => ts.CoachId)
                  .OnDelete(DeleteBehavior.Restrict);
                  
            entity.HasOne(ts => ts.Student)
                  .WithMany(u => u.StudentSessions)
                  .HasForeignKey(ts => ts.StudentId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MaterialPurchase>(entity =>
        {
            entity.HasOne(mp => mp.Student)
                  .WithMany(u => u.MaterialPurchases)
                  .HasForeignKey(mp => mp.StudentId)
                  .OnDelete(DeleteBehavior.Restrict);
                  
            entity.HasOne(mp => mp.Material)
                  .WithMany(tm => tm.Purchases)
                  .HasForeignKey(mp => mp.MaterialId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<CoachProfile>(entity =>
        {
            entity.HasOne(cp => cp.User)
                  .WithOne(u => u.CoachProfile)
                  .HasForeignKey<CoachProfile>(cp => cp.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Theme and Asset Management configuration
        modelBuilder.Entity<ThemeSettings>(entity =>
        {
            entity.HasKey(t => t.ThemeId);
            entity.Property(t => t.OrganizationName).HasMaxLength(200);
        });

        modelBuilder.Entity<ThemePreset>(entity =>
        {
            entity.HasKey(p => p.PresetId);
            entity.Property(p => p.PresetName).HasMaxLength(100);
        });

        modelBuilder.Entity<ActivityLog>(entity =>
        {
            entity.HasKey(a => a.LogId);
            entity.HasOne(a => a.User)
                  .WithMany()
                  .HasForeignKey(a => a.UserId)
                  .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
