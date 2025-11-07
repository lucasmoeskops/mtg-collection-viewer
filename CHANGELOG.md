# MTG Collection Viewer
## Changelog

### v2025.11.07
+ Better support for mobile.
+ Make background more stable in case of slow api's, and provide a default initial image.

### v2025.11.05
+ Background stays the same once you login. Changes every 15 seconds on the intro screen.
+ Add search option in editor set list.
+ Remove "Artificial delay for better UX" in AccountContextProvider.

### v2025.11.02
+ Integrated the Collection Editor into this project.
+ Added a login option with password to enable editing functions.
+ Reworked menu to allow different views than card views.
+ Added a home, settings and colofon page.

### v2025.11.01
+ Improved the error screen flashing
+ Every screen now has a background image
+ Filter context is cleared when switching between different view modes.
+ Current applied filters are written as readable string in the overview.
+ Fixed an issue that filter context was not saved when refreshing the page.

### v2025.10.28
+ Fixed a bug that a graph icon is not shown on a card if the current price change is exactly 0.
+ Improved the login screen with a nice random card artwork background image.