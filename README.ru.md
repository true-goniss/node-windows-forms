<p align="center">
    <img src="https://raw.githubusercontent.com/true-goniss/node-windows-forms/main/assets/logo.png" alt="node-windows-forms logo" width="250"
</p>
<br/>

# node-windows-forms

Легковесная Node.js обертка для нативных Windows Forms. Создавайте молниеносно быстрые нативные десктопные интерфейсы Windows прямо из Node.js с минимальным потреблением ресурсов.

---

## Почему node-windows-forms?

Если вы хотите написать десктопное приложение на Node.js, обычно ваш выбор — Electron. Но Electron тянет за собой целый браузер Chromium, из-за чего даже самое простое приложение "Hello World" потребляет 100+ МБ оперативной памяти и занимает сотни мегабайт на диске.

**node-windows-forms** решает эту проблему, используя изолированный C# хост, общающийся через IPC (межпроцессное взаимодействие).
- **Легковесность:** Потребляет всего ~30 МБ памяти.
- **Нативный UX (интерфейс):** Доступ к реальным нативным компонентам Windows (Системный трей, MessageBox, DataGridView и др.).
- **Надежная архитектура:** Node.js общается с уже скомпилированным C# `.exe` через именованные пайпы (Named Pipes). Никаких хрупких C++ модулей (native addons), которые ломаются при каждом обновлении Node.js!
- **Zero Config:** C# хост заранее скомпилирован в крошечный исполняемый файл. Просто напишите `npm install` и всё готово.

## Установка

```bash
npm install node-windows-forms
```

*Примечание: Пакет включает в себя прекомпилированный .NET 10 Framework бинарник. Если у пользователя не установлен .NET Desktop Runtime, Windows безопасно предложит ему скачать его с официального сайта Microsoft при первом запуске.*

## Быстрый старт (Hello World)

```javascript
const { WinFormsSession, Form, Button, MessageBox } = require('node-windows-forms');

async function main() {
    // 1. Инициализируем сессию
    const session = new WinFormsSession();
    await session.start();

    // 2. Создаем Окно (Form)
    const form = new Form(session);
    form.Text = "Мое первое приложение";
    form.Width = 300;
    form.Height = 200;

    // 3. Создаем Кнопку
    const btn = new Button(session, form);
    btn.Text = "Нажми меня!";
    btn.Width = 100;
    btn.Height = 40;
    btn.Left = 90;
    btn.Top = 50;

    // 4. Слушаем события
    btn.OnClick.Attach(() => {
        MessageBox.show(session, "Привет из Node.js!", "Успех", "OK", "Information");
    });

    // 5. Показываем окно
    await form.show();
}

main().catch(console.error);
```

## Возможности (Контролы)

- **Стандартные:** `Form`, `Button`, `TextBox`, `Label`, `ComboBox`, `CheckBox`, `Panel`, `FlowLayoutPanel`, `ListBox`, `PictureBox`, `ProgressBar`, `TabControl`.
- **Продвинутые:** `DataGridView` (Таблицы с двусторонним доступом к данным), `MenuStrip`, `ContextMenuStrip`.
- **Системный Трей:** `NotifyIcon` позволяет вашим Node.js приложениям тихо работать в панели задач (возле часов).
- **Нативные Диалоги:** `MessageBox`, `OpenFileDialog`, `SaveFileDialog`, `FolderBrowserDialog`.

## Пример приложения в трее

```javascript
const { WinFormsSession, NotifyIcon, ContextMenuStrip } = require('node-windows-forms');

async function run() {
    const session = new WinFormsSession();
    await session.start();

    // Создаем иконку в трее
    const trayIcon = new NotifyIcon(session);
    trayIcon.Text = "Мое Node.js Приложение";
    trayIcon.Icon = "default"; 
    trayIcon.Visible = true;

    // Добавляем меню по правому клику
    const contextMenu = new ContextMenuStrip(session);
    const exitItem = contextMenu.addMenuItem("Выход");
    
    exitItem.OnClick.Attach(() => {
        trayIcon.Visible = false;
        session.stop();
        process.exit(0);
    });

    trayIcon.ContextMenuStrip = contextMenu.id;
}

run();
```

## Как это работает под капотом

1. Когда вы вызываете `new WinFormsSession().start()`, Node.js запускает легковесное, прекомпилированное C# приложение (`node-windows-forms.exe`).
2. Node.js генерирует уникальный Named Pipe (именованный канал) и передает его в C# процесс.
3. Node.js отправляет JSON-команды через этот канал для создания компонентов (`{"action": "create", "type": "Button", ...}`).
4. C# процесс моментально отрисовывает настоящие нативные WinForms компоненты.
5. Когда пользователь нажимает кнопку, C# отправляет JSON-событие обратно в Node.js.

## Лицензия

ISC License.

---
> 🇬🇧 **English version:** [README.md](README.md)
