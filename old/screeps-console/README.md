# Screeps Console

This project streams the Screeps console output to the terminal. It strips out
any html tags and adds colors.

![Screeps Interactive Console](docs/screenshot.png?raw=true "Screeps Interactive Console")

## Requirements

 - Docker


## Installation

Note: This application runs on both Python 2 and Python 3.

1. Create `.screepsconsole.yaml` file:
 
   ```bash
   cp .screepsconsole.example.yaml .screepsconsole.yaml
   ```

1. Edit `.screepsconsole.yaml` with your `username` and `token`

1. Execute the project

   ```bash
   docker-compose up
   ```


## Colors and Severity

Console output can have colors, in both the website version and the shell. To
get the best of both worlds use font tags that also have a severity attribute.

```
<font color="#999999" severity="2">Message goes here!</font>
```

The severity can be anywhere from 0 to 5, with five being the most extreme. In
addition you can highlight a log line by giving it the 'type' of 'highlight'.

```
<font color="#ffff00" type="highlight>This message will stand out!</font>
```

If you do not care about coloring the web console output you can use a simpler
format.

```
<log severity="2">Message goes here</log>
<log type="highlight>This message will stand out!</log>
```

An [example logger](docs/ExampleLogger.js) is included in the docs folder to
demonstrate how this works.
