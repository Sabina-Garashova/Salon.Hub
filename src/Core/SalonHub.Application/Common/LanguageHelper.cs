namespace SalonHub.Application.Common;

public static class LanguageHelper
{
    public static string Select(string nameAz, string? nameRu, string? nameEn, string? requestedLanguage)
    {
        var lang = requestedLanguage?.ToLower().Trim() ?? "az";

        return lang switch
        {
            "ru" => !string.IsNullOrWhiteSpace(nameRu) ? nameRu : nameAz,
            "en" => !string.IsNullOrWhiteSpace(nameEn) ? nameEn : nameAz,
            _ => nameAz
        };
    }
}
