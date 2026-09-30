Visual Studio Designer Example (Attach Mode)

This example demonstrates how to build your UI visually in Visual Studio using the native Windows Forms Designer, and then control it from Node.js.

How to use:
1. Go to the `DesignerApp` folder and compile the C# project (e.g., run `dotnet build`).
2. Run the compiled `DesignerApp.exe` (this acts as the IPC Server waiting for Node.js).
3. Run `node app.js` in a separate terminal.

Notice how Node.js automatically detects the `Form1` and `button1` components that were created visually in C#, allowing you to attach JavaScript event listeners and modify properties without having to manually create the controls from scratch in JS.

---

Integration Details:
To use the Windows Forms Designer with `node-windows-forms`, your C# project needs access to the IPC host classes.
The necessary files are the source codes located in `src/Core/` and `src/IPC/`. 

In this example, instead of duplicating the code, these files are imported dynamically via MSBuild in the `DesignerApp.csproj` file using the `Link` attribute:

<ItemGroup>
  <Compile Include="..\..\..\src\Core\**\*.cs" Link="Core\%(RecursiveDir)%(Filename)%(Extension)" />
  <Compile Include="..\..\..\src\IPC\**\*.cs" Link="IPC\%(RecursiveDir)%(Filename)%(Extension)" />
</ItemGroup>

This allows you to visually design your application in Visual Studio while staying synced with the latest library source code.