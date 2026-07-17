using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SalonHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UploadController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".webp" };
        private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB

        public UploadController(IWebHostEnvironment env)
        {
            _env = env;
        }

        [HttpPost("image")]
        [Authorize]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            if (file is null || file.Length == 0)
                return BadRequest(new { message = "Fayl bos ola bilmez." });

            if (file.Length > MaxFileSizeBytes)
                return BadRequest(new { message = "Fayl 5MB-dan boyuk ola bilmez." });

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!AllowedExtensions.Contains(extension))
                return BadRequest(new { message = "Yalniz sekil fayllari qebul olunur (jpg, jpeg, png, webp)." });

            var uploadsPath = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), "uploads");
            Directory.CreateDirectory(uploadsPath);

            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var url = $"{Request.Scheme}://{Request.Host}/uploads/{fileName}";
            return Ok(new { url });
        }
    }
}
