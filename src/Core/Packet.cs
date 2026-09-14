using System.Text.Json;
using System.Text.Json.Serialization;

namespace NodeWindowsForms.Core
{
    // Message coming from Node.js
    public class InboundMessage
    {
        [JsonPropertyName("id")]
        public string Id { get; set; }

        [JsonPropertyName("target")]
        public string TargetId { get; set; }

        [JsonPropertyName("action")]
        public string Action { get; set; }

        [JsonPropertyName("args")]
        public JsonElement Args { get; set; } // Raw JSON for flexibility
    }

    // Message sent back to Node.js
    public class OutboundMessage
    {
        [JsonPropertyName("id")]
        public string Id { get; set; }

        [JsonPropertyName("type")]
        public string Type { get; set; } // "response", "event", "error"

        [JsonPropertyName("payload")]
        public object Payload { get; set; }
    }
}