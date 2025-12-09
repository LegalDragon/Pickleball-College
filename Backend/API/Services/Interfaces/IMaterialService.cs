using Pickleball.College.Models.DTOs;
using Pickleball.College.Models.Entities;

namespace Pickleball.College.Services;

public interface IMaterialService
{
    Task<MaterialDto> CreateMaterialAsync(Guid coachId, CreateMaterialRequest request, string? videoUrl, string? thumbnailUrl);
    Task<PurchaseResult> PurchaseMaterialAsync(Guid studentId, Guid materialId);
    Task<List<MaterialDto>> GetPublishedMaterialsAsync();
    Task<List<MaterialDto>> GetCoachMaterialsAsync(Guid coachId);
    Task<MaterialDto> GetMaterialAsync(Guid materialId);
}

public interface IFileStorageService
{
    Task<string> UploadFileAsync(IFormFile file, string containerName);
    Task DeleteFileAsync(string fileUrl);
}

public interface IStripeService
{
    Task<Stripe.PaymentIntent> CreatePaymentIntentAsync(decimal amount, string description);
    Task<string> CreateCoachAccountAsync(string email);
    Task<bool> ProcessPayoutAsync(string coachStripeAccountId, decimal amount);
}

public interface IAuthService
{
    Task<User?> AuthenticateAsync(string email, string password);
    Task<User?> FastAuthenticateAsync(string token);
    Task<User> RegisterAsync(RegisterRequest request);
    string GenerateJwtToken(User user);
}

public interface ISessionService
{
    Task<TrainingSession> ScheduleSessionAsync(SessionRequest request, Guid studentId);
    Task<List<TrainingSession>> GetCoachSessionsAsync(Guid coachId);
    Task<List<TrainingSession>> GetStudentSessionsAsync(Guid studentId);
    Task<bool> CancelSessionAsync(Guid sessionId, Guid userId);
}
