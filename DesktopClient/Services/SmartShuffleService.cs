using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;

namespace DesktopClient
{
    public class SmartShuffleService
    {
        private readonly HttpClient _httpClient;

        public SmartShuffleService()
        {
            _httpClient = new HttpClient { BaseAddress = new Uri("http://127.0.0.1:8000") };
        }

        public async Task<List<Guid>> GetRecommendationsAsync(Guid seedSongId)
        {
            var request = new { song_id = seedSongId };
            var response = await _httpClient.PostAsJsonAsync("/api/smart-shuffle", request);
            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadFromJsonAsync<SmartShuffleResponse>();
            return result?.SongIDs ?? new List<Guid>();
        }
    }

    public class SmartShuffleResponse
    {
        public List<Guid> SongIDs { get; set; } = new();
    }
}
