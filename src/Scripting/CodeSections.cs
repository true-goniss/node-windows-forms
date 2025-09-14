public enum Section
{
    eventEmittersJS
}

public static class CodeSections
{

    private static readonly Dictionary<Section, string> _names = new Dictionary<Section, string>
    {
        [Section.eventEmittersJS] = "{{eventEmittersJS}}",
    };

    public static string GetName(Section section) => _names[section];
}