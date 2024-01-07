Playwright screenshots
===========

This library demonstrates how to use a screenshotter library to extend
the screenshots playwright can create to also add an identifier,
screenshot count, and timestamp. This is useful for debugging
as well as generating screenshots for use in validation docs.

## system setup

In order to take screenshots and process them with canvas/sharp, we need some
libraries installed:

On a macbook:

```
brew install pkg-config cairo pango libpng jpeg giflib librsvg 
```

on ubuntu https://github.com/Automattic/node-canvas/wiki/Installation:-Ubuntu-and-other-Debian-based-systems

