RichMarker
==========
RichMarker is a Google Maps utility based on the utility library of the same name available on this location https://code.google.com/p/google-maps-utility-library-v3/wiki/Libraries so it's more of a fork since I used the original as the basis for all the methods in this one.

The only difference is that while the original works as a stand-alone js file whose methods are available publicly, this one is intended to be integrated within a project built using the Google closure library. I'll demonstrate how in a demo.

Additionally, with RichMarker(the original), if Google Maps isn't already loaded and the time the Richmarker js loads, a "google is undefined" error is usually thrown.

This is because of this bit:

RichMarker.prototype = new google.maps.OverlayView();

The RichMarker object extends the google.maps.OverlayView class, therefore for it to work the google.maps.OverlayView class has to be available in the global scope.

My RichMarker, instead, extends Google Closure's goog.events.EventTarget class, while google.maps.OverlayView is stored in a property within the larger goog.maps.RichMarker class.

google.maps.OverlayView has 3 methods that need to be implemented. Currently haven't figured out a way of extending the class before the maps namespace is available in the global scope. My current workaround has involved modifying the constructor from the instance created which I'm sure will turn problematic once there are more than 1 marker involved.