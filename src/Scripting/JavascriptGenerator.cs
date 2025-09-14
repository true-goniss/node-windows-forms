using System.Text;

public class JavaScriptGenerator
{
    private readonly StringBuilder _sb = new();
    private readonly List<string> _exports = new();

    public JavaScriptGenerator AddStrictMode()
    {
        _sb.AppendLine("\"use strict\";");
        return this;
    }

    public JavaScriptGenerator AddLine(string line)
    {
        _sb.AppendLine(line);
        return this;
    }

    public JavaScriptGenerator AddImport(string module, params string[] imports)
    {
        _sb.AppendLine($"const {{ {string.Join(", ", imports)} }} = require(`{module}`);");
        return this;
    }

    public JavaScriptGenerator AddVariable(string name, string value)
    {
        _sb.AppendLine($"let {name} = {value};");
        _exports.Add(name);
        return this;
    }

    public JavaScriptGenerator AddFunction(string name, string parameters, string body)
    {
        _sb.AppendLine($"function {name}({parameters}) {{");
        _sb.AppendLine(body);
        _sb.AppendLine("}");
        _exports.Add(name);
        return this;
    }

    public JavaScriptGenerator AddExports(params string[] exports)
    {
        _sb.AppendLine("module.exports = {");
        _sb.AppendLine(string.Join(",", exports));
        _sb.AppendLine("};");
        return this;
    }

    public string Generate() => _sb.ToString();
}