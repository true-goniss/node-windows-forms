using System.ComponentModel;
using System.Reflection;
using System.Text;

static class CsharpEventHandlers
{
    public static string delegatesGenerated = "";
    public static string delegatesRunnerGenerated = "";

    static string addedEventNames = "";
    static string addedTextboxTextChangedEventNames = "";
    static string eventArgsTypeNames = "";
    static string eventHandlersTypesNames = "";

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

        if (!addedEventNames.Contains(fullEventName))
        {
            addedEventNames += fullEventName + ";";
            EventInfo eventInfo = control.GetType().GetEvent(eventName);
            if (eventInfo != null)
            {
                if (eventInfo.EventHandlerType.Name.Equals("EventHandler"))
                {
                    eventInfo.AddEventHandler(control, CreateDynamic_EventHandler(eventName));
                }
                else if (eventInfo.EventHandlerType.Name.Equals("UICuesEventHandler"))
                {
                    eventInfo.AddEventHandler(control, CreateDynamic_UICuesEventHandler(eventName));
                }
                else if (eventInfo.EventHandlerType.Name.Equals("ControlEventHandler"))
                {
                    eventInfo.AddEventHandler(control, CreateDynamic_ControlEventHandler(eventName));
                }
                else if (eventInfo.EventHandlerType.Name.Equals("DragEventHandler"))
                {
                    eventInfo.AddEventHandler(control, CreateDynamic_DragEventHandler(eventName));
                }
                else if (eventInfo.EventHandlerType.Name.Equals("GiveFeedbackEventHandler"))
                {
                    eventInfo.AddEventHandler(control, CreateDynamic_GiveFeedbackEventHandler(eventName));
                }
                else if (eventInfo.EventHandlerType.Name.Equals("HelpEventHandler"))
                {
                    eventInfo.AddEventHandler(control, CreateDynamic_HelpEventHandler(eventName));
                }
                else if (eventInfo.EventHandlerType.Name.Equals("InvalidateEventHandler"))
                {
                    eventInfo.AddEventHandler(control, CreateDynamic_InvalidateEventHandler(eventName));
                }
                else if (eventInfo.EventHandlerType.Name.Equals("KeyEventHandler"))
                {
                    eventInfo.AddEventHandler(control, CreateDynamic_KeyEventHandler(eventName));
                }
                else if (eventInfo.EventHandlerType.Name.Equals("KeyPressEventHandler"))
                {
                    eventInfo.AddEventHandler(control, CreateDynamic_KeyPressEventHandler(eventName));
                }
                else if (eventInfo.EventHandlerType.Name.Equals("LayoutEventHandler"))
                {
                    eventInfo.AddEventHandler(control, CreateDynamic_LayoutEventHandler(eventName));
                }
                else if (eventInfo.EventHandlerType.Name.Equals("MouseEventHandler"))
                {
                    eventInfo.AddEventHandler(control, CreateDynamic_MouseEventHandler(eventName));
                }
                else if (eventInfo.EventHandlerType.Name.Equals("PaintEventHandler"))
                {
                    eventInfo.AddEventHandler(control, CreateDynamic_PaintEventHandler(eventName));
                }
                else if (eventInfo.EventHandlerType.Name.Equals("PreviewKeyDownEventHandler"))
                {
                    eventInfo.AddEventHandler(control, CreateDynamic_PreviewKeyDownEventHandler(eventName));
                }
                else if (eventInfo.EventHandlerType.Name.Equals("QueryContinueDragEventHandler"))
                {
                    eventInfo.AddEventHandler(control, CreateDynamic_QueryContinueDragEventHandler(eventName));
                }
                else if (eventInfo.EventHandlerType.Name.Equals("CancelEventHandler"))
                {
                    eventInfo.AddEventHandler(control, CreateDynamic_CancelEventHandler(eventName));
                }

                CsharpEventHandlers.GenerateEventHandlerDelegatesString(eventName, eventInfo.EventHandlerType.Name, eventInfo.EventHandlerType.GetMethod("Invoke").GetParameters()[1].ParameterType.Name);

            }
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