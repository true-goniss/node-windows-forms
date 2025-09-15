using System.ComponentModel;
using System.Reflection;
using System.Text;
using System.Collections.Concurrent;

static class CsharpEventHandlers
{
    public static string delegatesGenerated = "";
    public static string delegatesRunnerGenerated = "";

    static string addedTextboxTextChangedEventNames = "";
    static string eventArgsTypeNames = "";
    static string eventHandlersTypesNames = "";

    private static readonly ConcurrentDictionary<(Type, string), EventInfo> EventInfoCache =
    new ConcurrentDictionary<(Type, string), EventInfo>();

    private static readonly ConcurrentDictionary<string, byte> AddedEventNames = new ConcurrentDictionary<string, byte>();

    private static readonly Dictionary<string, Func<string, Delegate>> EventHandlerFactories =
        new Dictionary<string, Func<string, Delegate>>
        {
        {"EventHandler", CreateDynamic_EventHandler},
        {"UICuesEventHandler", CreateDynamic_UICuesEventHandler},
        {"ControlEventHandler", CreateDynamic_ControlEventHandler},
        {"DragEventHandler", CreateDynamic_DragEventHandler},
        {"GiveFeedbackEventHandler", CreateDynamic_GiveFeedbackEventHandler},
        {"HelpEventHandler", CreateDynamic_HelpEventHandler},
        {"InvalidateEventHandler", CreateDynamic_InvalidateEventHandler},
        {"KeyEventHandler", CreateDynamic_KeyEventHandler},
        {"KeyPressEventHandler", CreateDynamic_KeyPressEventHandler},
        {"LayoutEventHandler", CreateDynamic_LayoutEventHandler},
        {"MouseEventHandler", CreateDynamic_MouseEventHandler},
        {"PaintEventHandler", CreateDynamic_PaintEventHandler},
        {"PreviewKeyDownEventHandler", CreateDynamic_PreviewKeyDownEventHandler},
        {"QueryContinueDragEventHandler", CreateDynamic_QueryContinueDragEventHandler},
        {"CancelEventHandler", CreateDynamic_CancelEventHandler}
        };

    public static string GetEventName(Control control, string eventName)
    {
        EventInfo eventInfo = control.GetType().GetEvent(eventName);

        if (eventInfo != null)
        {
            return $"{control.Name}_{eventInfo.Name}";
        }
        else
        {
            return null;
        }
    }

    public static void CreateAndAttachDynamicEventHandler(Control control, string eventName)
    {
        string fullEventName = GetEventName(control, eventName);

        if (!AddedEventNames.TryAdd(fullEventName, 0))
            return;

        var cacheKey = (control.GetType(), eventName);

        if (!EventInfoCache.TryGetValue(cacheKey, out EventInfo eventInfo))
        {
            eventInfo = control.GetType().GetEvent(eventName);
            if (eventInfo != null)
            {
                EventInfoCache[cacheKey] = eventInfo;
            }
        }

        if (eventInfo == null)
            return;

        string handlerTypeName = eventInfo.EventHandlerType.Name;

        if (EventHandlerFactories.TryGetValue(handlerTypeName, out var factory))
        {
            Delegate handler = factory(eventName);
            eventInfo.AddEventHandler(control, handler);

            MethodInfo invokeMethod = eventInfo.EventHandlerType.GetMethod("Invoke");
            string parameterTypeName = invokeMethod.GetParameters()[1].ParameterType.Name;

            CsharpEventHandlers.GenerateEventHandlerDelegatesString(
                eventName,
                handlerTypeName,
                parameterTypeName
            );
        }
    }

    // i use delegatesGenerated and delegatesRunnerGenerated strings to generate C# delegate and their runners and then paste this stuff manually
    private static void GenerateEventHandlerDelegatesString(string eventName, string eventHandlerType, string eventArgsType)
    {
        if (eventHandlersTypesNames.Contains(eventHandlerType))
        {
            return;
        }
        else
        {
            eventHandlersTypesNames += eventHandlerType + ";";
        }

        delegatesGenerated += "public static " + eventHandlerType + " CreateDynamic_" + eventHandlerType + " (string eventName){ ";
        delegatesGenerated += @"return (sender, e) => { string eventArgs = ConvertPropertiesToJson(e); nwfEventHandler(eventName, sender, eventArgs); };";
        delegatesGenerated += "}";


        if (delegatesRunnerGenerated != "")
        {
            delegatesRunnerGenerated += "else ";
        }

        delegatesRunnerGenerated += "if (eventInfo.EventHandlerType.Name.Equals(\"" + eventHandlerType + "\"" + "))" + "{ " + "eventInfo.AddEventHandler(control,  CreateDynamic_" + eventHandlerType + "(eventName)); }";
    }

    public static void nwfEventHandler(string eventName, object sender, string eventArgs)
    {
        NodeControls.ReconnectSocketOnDisconnect();
        //System.Diagnostics.Debug.WriteLine(eventName);
        NodeControls.SendToSocket("nwfEventEmit: " + (sender as Control).Name + "_" + eventName + "nwfEventArgs:" + eventArgs);
    }


    static string ConvertPropertiesToJson(object obj)
    {

        StringBuilder jsonBuilder = new StringBuilder("{");
        Type type = obj.GetType();

        if (!type.Name.Contains("Event")) return new StringBuilder("{}").ToString();

        PropertyInfo[] properties = type.GetProperties();

        bool commaNeeded = false;

        try
        {
            foreach (var property in properties)
            {
                object value = property.GetValue(obj);

                if (commaNeeded) jsonBuilder.Append(",");

                jsonBuilder.AppendFormat("\"{0}\":", property.Name);

                if (value != null && property.PropertyType.Namespace != "System")
                {
                    jsonBuilder.Append(ConvertPropertiesToJson(value));
                }
                else
                {
                    jsonBuilder.AppendFormat("\"{0}\"", value);
                }

                commaNeeded = true;
            }
        }
        catch (Exception ee) { return new StringBuilder("{}").ToString(); }

        jsonBuilder.Append("}");

        return jsonBuilder.ToString();

    }

    public static EventHandler CreateDynamic_EventHandler(string eventName)
    {
        return (sender, e) => {
            string eventArgs = ConvertPropertiesToJson(e);
            nwfEventHandler(eventName, sender, eventArgs);
        };
    }
    public static UICuesEventHandler CreateDynamic_UICuesEventHandler(string eventName)
    {
        return (sender, e) => {
            string eventArgs = ConvertPropertiesToJson(e);
            nwfEventHandler(eventName, sender, eventArgs);
        };
    }
    public static ControlEventHandler CreateDynamic_ControlEventHandler(string eventName)
    {
        return (sender, e) => {
            string eventArgs = ConvertPropertiesToJson(e);
            nwfEventHandler(eventName, sender, eventArgs);
        };
    }
    public static DragEventHandler CreateDynamic_DragEventHandler(string eventName)
    {
        return (sender, e) => {
            string eventArgs = ConvertPropertiesToJson(e);
            nwfEventHandler(eventName, sender, eventArgs);
        };
    }
    public static GiveFeedbackEventHandler CreateDynamic_GiveFeedbackEventHandler(string eventName)
    {
        return (sender, e) => {
            string eventArgs = ConvertPropertiesToJson(e);
            nwfEventHandler(eventName, sender, eventArgs);
        };
    }
    public static HelpEventHandler CreateDynamic_HelpEventHandler(string eventName)
    {
        return (sender, e) => {
            string eventArgs = ConvertPropertiesToJson(e);
            nwfEventHandler(eventName, sender, eventArgs);
        };
    }
    public static InvalidateEventHandler CreateDynamic_InvalidateEventHandler(string eventName)
    {
        return (sender, e) => {
            string eventArgs = ConvertPropertiesToJson(e);
            nwfEventHandler(eventName, sender, eventArgs);
        };
    }
    public static KeyEventHandler CreateDynamic_KeyEventHandler(string eventName)
    {
        return (sender, e) => {
            string eventArgs = ConvertPropertiesToJson(e);
            nwfEventHandler(eventName, sender, eventArgs);
        };
    }
    public static KeyPressEventHandler CreateDynamic_KeyPressEventHandler(string eventName)
    {
        return (sender, e) => {
            string eventArgs = ConvertPropertiesToJson(e);
            nwfEventHandler(eventName, sender, eventArgs);
        };
    }
    public static LayoutEventHandler CreateDynamic_LayoutEventHandler(string eventName)
    {
        return (sender, e) => {
            string eventArgs = ConvertPropertiesToJson(e);
            nwfEventHandler(eventName, sender, eventArgs);
        };
    }
    public static MouseEventHandler CreateDynamic_MouseEventHandler(string eventName)
    {
        return (sender, e) => {
            string eventArgs = ConvertPropertiesToJson(e);
            nwfEventHandler(eventName, sender, eventArgs);
        };
    }
    public static PaintEventHandler CreateDynamic_PaintEventHandler(string eventName)
    {
        return (sender, e) => {
            string eventArgs = ConvertPropertiesToJson(e);
            nwfEventHandler(eventName, sender, eventArgs);
        };
    }
    public static PreviewKeyDownEventHandler CreateDynamic_PreviewKeyDownEventHandler(string eventName)
    {
        return (sender, e) => {
            string eventArgs = ConvertPropertiesToJson(e);
            nwfEventHandler(eventName, sender, eventArgs);
        };
    }
    public static QueryContinueDragEventHandler CreateDynamic_QueryContinueDragEventHandler(string eventName)
    {
        return (sender, e) => {
            string eventArgs = ConvertPropertiesToJson(e);
            nwfEventHandler(eventName, sender, eventArgs);
        };
    }
    public static CancelEventHandler CreateDynamic_CancelEventHandler(string eventName)
    {
        return (sender, e) => {
            string eventArgs = ConvertPropertiesToJson(e);
            nwfEventHandler(eventName, sender, eventArgs);
        };
    }

    private static void PrintEventNamesFromSourceCode()
    {
        string eventMethods = @"";

        string[] methodSignatures = eventMethods.Split(new string[] { "protected virtual void ", "(" }, StringSplitOptions.RemoveEmptyEntries);

        List<string> methodNames = new List<string>();

        for (int i = 0; i < methodSignatures.Length; i += 1)
        {
            string methodName = methodSignatures[i].Trim();

            if (methodName.Contains("On"))
            {
                methodNames.Add(methodName.Replace("On", ""));
            }
        }

        foreach (var eventName in methodNames)
        {
            System.Diagnostics.Debug.WriteLine("\"" + eventName + "\"" + ",");
        }
    }
}