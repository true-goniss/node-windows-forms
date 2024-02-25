# node-windows-forms
Lightweight and easy-to-use GUI toolset for node js on windows. Compose your interface in Visual Studio, then use it in Node. Work in progress



<img src="https://github.com/true-goniss/node-windows-forms/assets/42878452/95731c2d-0ceb-4558-9710-ff5323eb9e37" width=20% height=20%>

## Available controls:
```csharp
Button
TextBox
Label
RadioButton
CheckBox
NumericUpDown
```

<br><br>

## How to use:
### ```Step 1:```
Create Windows Forms Project in your Visual Studio. Add controls to your form, install ```WebSocket4Net``` library from Nuget
<br><br>

### ```Step 2:```
In C# code: import class ```NodeControls.cs``` to your project, then in the beginning of your ```Form``` class add line: 
```csharp
NodeControls.Generate(this, "null", @"C:\path-to-your-nodejs-project\node-windows-forms");
```
Where ```path-to-your-nodejs-project``` is path to your node project, to generate set of controls. In this case, only the controls without any tags will be generated.
<br><br>

### ```Step 3:```
Compile C# project and run .exe

### ```Step 4:``` 
Install 'ws' library via npm. In your javascript code you can use Form controls :

```javascript
const form = require('./node-windows-forms/form');

form.button1.OnClick(async (eventArgs) => {

    form.textBox2.setText( await form.textBox1.getText() );

    console.log(eventArgs);
    
});

form.numericUpDown1.OnValueChanged(async () => {

    const numberValue = await form.numericUpDown1.getValue();
    form.textBox1.setText( numberValue.toString() );
    
    console.log(await form.textBox1.Focus());

});
