/**
 * overview workaround of the current overview that refences 
 * google.maps.OverlayView when an instance is created avoiding the whole prorotype fiasco of 2014
 * This port acts as part of the overall compiled .js file rather than require referencing externally
 */
 
// JavaScript Document
goog.provide('goog.maps.RichMarker');

goog.require('goog.dom');
goog.require( 'goog.events.EventTarget' );

/**
 * @param {google.maps.Map} map
 * @param {Object=} opt_options
 * @constructor
 * @extends {goog.events.EventTarget}
 * References:
 * https://developers.google.com/maps/documentation/javascript/reference#MVCObject
 * https://developers.google.com/maps/documentation/javascript/customoverlays
 * https://developers.google.com/maps/documentation/javascript/reference#OverlayView
 * https://developers.google.com/maps/documentation/javascript/reference#MapPanes
 */
goog.maps.RichMarker = function( map, opt_options )
{
	goog.events.EventTarget.call(this);
	
	var options = opt_options || {};
	
	this.visible_ = options['visible'] || true;
	
	this.anchor_ = options['anchor'] || goog.maps.RichMarker.Position.BOTTOM;
	
	this.shadow_ = options['shadow'] || '7px -3px 5px rgba(88,88,88,0.7)';
	
	this.content_ = options['content'] || null;
	
	this.position_ = options['position'] || null;
	
	this.isDraggable_ = options['draggable'] || false;
	
	this.map = map;
	
	this.overlay = new google.maps.OverlayView();
	
	this.overlay.setValues(options);
	
	/**
	 * Implementations:
	 * Extend the prototype by editing the constructor since the google.maps.OverlayView object 
	 * has already been instantiated.
	 * Not sure how this will interfere with another library that has also extended the OverlayView class
	 * Ref: http://stackoverflow.com/questions/7015693/how-to-set-the-prototype-of-a-javascript-object-that-has-already-been-instantiat
	*/
	this.overlay.constructor.prototype.onAdd = goog.bind(this.onAdd, this );
	
	this.overlay.constructor.prototype.draw = goog.bind(this.draw, this);
	
	this.overlay.constructor.prototype.onRemove = goog.bind( this.onRemove,this );
	
	this.overlay.setMap( this.map );
	
}

goog.inherits( goog.maps.RichMarker, goog.events.EventTarget );

/**
 * @enum {string}
 */
goog.maps.RichMarker.EventType = {
	ZINDEXCHANGED: 'zIndex_changed',
	POSITIONCHANGED: 'position_changed',
	ANCHORCHANGED: 'anchor_changed',
	CONTENTCHANGED:'content_changed'
};

/**
 * @enum {number}
 */
goog.maps.RichMarker.Position = {
	TOP_LEFT: 1,
	TOP: 2,
	TOP_RIGHT: 3,
	LEFT: 4,
	MIDDLE: 5,
	RIGHT: 6,
	BOTTOM_LEFT: 7,
	BOTTOM: 8,
	BOTTOM_RIGHT: 9
}

/**
 * @type {google.maps.OverlayView}
 */
goog.maps.RichMarker.prototype.overlay;

/**
 * @type {google.maps.Map}
 */
goog.maps.RichMarker.prototype.map;

/**
 * @type {boolean}
 * @private
 */
goog.maps.RichMarker.prototype.ready_ = false;

/**
 * @type {boolean}
 * @private
 */
goog.maps.RichMarker.prototype.isDragging_ = false;

/**
 * @type {boolean}
 * @private
 */
goog.maps.RichMarker.prototype.isDraggable_ = false;

/**
 * @type {boolean}
 * @private
 */
goog.maps.RichMarker.prototype.visible_ = true;

/**
 * @type {boolean}
 * @private
 */
goog.maps.RichMarker.prototype.flat_ = true;

/**
 * @type {goog.maps.RichMarker.Position|google.maps.Size}
 * @private
 */
goog.maps.RichMarker.prototype.anchor_;

/**
 * @type {google.maps.LatLng}
 * @private
 */
goog.maps.RichMarker.prototype.position_;

/**
 * @type {number}
 * @private
 */
goog.maps.RichMarker.prototype.width_ = 0;

/**
 * @type {number}
 * @private
 */
goog.maps.RichMarker.prototype.height_ = 0;

/**
 * @type {number}
 * @private
 */
goog.maps.RichMarker.prototype.zIndex_ = 0;

/**
 * @type {string|Node}
 * @private
 */
goog.maps.RichMarker.prototype.content_;

/**
 * @type {string}
 * @private
 */
goog.maps.RichMarker.prototype.shadow_ = '';

/**
 * @type {Element}
 * @private
 */
goog.maps.RichMarker.prototype.overlayWrapper_;

/**
 * @type {Element}
 * @private
 */
goog.maps.RichMarker.prototype.overlayContent_;


goog.maps.RichMarker.prototype.isVisible = function()
{
	return this.visible_;
	//return this.overlay.get('visible');
}

/**
 * @param {boolean} show
 */
goog.maps.RichMarker.prototype.setVisible = function( show )
{
	this.visible_ = show;
	//this.overlay.set( 'visible', show );
}

/**
 * Implement of the google.maps.OverlayView's onAdd method
 */
goog.maps.RichMarker.prototype.onAdd = function()
{
	this.overlayWrapper_ = goog.dom.createDom( 'div');
	
	this.overlayWrapper_.style.position = 'absolute';
	
	this.overlayWrapper_.style.display = this.isVisible() ? '':'none';
	
	if( !this.overlayContent_ )
	{
		this.overlayContent_ = goog.dom.createDom('div');
		
		this.overlayContent_.style.position = 'relative';
		
		this.overlayWrapper_.appendChild( this.overlayContent_ );
		
		google.maps.event.addDomListener( this.overlayContent_, 'click', goog.bind(function(e)
		{
			google.maps.event.trigger( this.overlay, 'click');
		}, this));
		
		google.maps.event.addDomListener( this.overlayContent_, 'mouseover', goog.bind(function(e)
		{
			google.maps.event.trigger( this.overlay, 'mouseover');
		}, this));
		
		google.maps.event.addDomListener( this.overlayContent_, 'mouseout', goog.bind(function(e)
		{
			google.maps.event.trigger( this.overlay, 'mouseout');
		}, this));
		
	}
	
	this.ready_ = true;
	
	this.updateContent();
	/**
	 * Reference:
	 * https://developers.google.com/maps/documentation/javascript/reference#MapPanes
	 */
	var mapPanes = this.overlay.getPanes();
	
	if( mapPanes )
	{
		mapPanes.overlayMouseTarget.appendChild( this.overlayWrapper_ );
	}
	
	google.maps.event.trigger( this.overlay, 'ready' );
	
}

/**
 * Implement of the google.maps.OverlayView's draw method
 */
goog.maps.RichMarker.prototype.draw = function()
{
	console.log( 'draw implement ');
	if( !this.ready_ || this.isDragging_ )
	{
		return;
	}
	
	var projection = this.overlay.getProjection();
	
	if( !projection )
		return;
		
	var latLng = this.getPosition(),
	
	position = projection.fromLatLngToDivPixel( latLng ),
	
	offset = this.getOffset();
	
	this.overlayContent_.style.top = ( position.y + offset.height ) + 'px';
	
	this.overlayContent_.style.left = ( position.x + offset.width ) + 'px';
	
	var width = this.overlayContent_.offsetWidth,
	
	height = this.overlayContent_.offsetHeight;
	
	if( width !== this.width_ )
	{
		this.width_ = width;
	}
	
	if( height !== this.height_ )
	{
		this.height_ = height;
	}
	
}

/**
 * Implement of the google.maps.OverlayView's onRemove method
 */
goog.maps.RichMarker.prototype.onRemove = function()
{
	if ( this.overlayWrapper_ && this.overlayWrapper_.parentNode )
	{
		this.overlayWrapper_.parentNode.removeChild( this.overlayWrapper_ );
	}
}

/**
 * Gets the postiton of the marker.
 * @return {google.maps.LatLng} The position of the marker.
 */
goog.maps.RichMarker.prototype.getPosition = function()
{
	return this.position_;
}

/**
 * Set the postiton of the marker.
 * @param {google.maps.LatLng} latLng The position of the marker.
 */
goog.maps.RichMarker.prototype.setPosition = function( latLng )
{
	this.position_ = latLng;
}

/**
 * Get the anchor 
 * @return {goog.maps.RichMarker.Position|google.maps.Size} 
 */
goog.maps.RichMarker.prototype.getAnchor = function()
{
	return this.anchor_;
}

/**
 * Set the anchor 
 * @param { goog.maps.RichMarker.Position|google.maps.Size } anchor
 */
goog.maps.RichMarker.prototype.setAnchor = function( anchor )
{
	this.anchor_ = anchor;
}


/**
 * Get the content 
 * @return {string||Node} 
 */
goog.maps.RichMarker.prototype.getContent = function()
{
	return this.content_;
}

/**
 * Set content 
 * @param {string||Node} content
 */
goog.maps.RichMarker.prototype.setContent = function( content )
{
	this.content_ = content;
}

/**
 * Get the z index 
 * @return {number} 
 */
goog.maps.RichMarker.prototype.getZIndex = function()
{
	return this.zIndex_;
}

/**
 * 
 * @param {boolean} isFlat
 */
goog.maps.RichMarker.prototype.setFlat = function( isFlat )
{
	this.flat_ = isFlat;
}

/**
 * Set shadow 
 * @param {string} shadow
 */
goog.maps.RichMarker.prototype.setShadow = function( shadow )
{
	this.shadow_ = shadow;
	
	this.updateShadow();
	
}

/**
 * Get shadow 
 * @return {string}
 */
goog.maps.RichMarker.prototype.setShadow = function()
{
	return this.shadow_ ;
}

/**
 * @return {google.maps.Size} 
 */
goog.maps.RichMarker.prototype.getOffset = function()
{
	
	if( 'object' == typeof this.anchor_ )
	{
		return /** @type {google.maps.Size} */ ( this.anchor_ );
	}
	
	 var offset = new google.maps.Size(0, 0);
	 
	 if( !this.overlayContent_ )
		return offset;
	
	var width = this.overlayContent_.offsetWidth,
	
	height = this.overlayContent_.offsetHeight;
	
	switch( this.anchor_ )
	{
		case goog.maps.RichMarker.Position.TOP_LEFT:
			break
		case goog.maps.RichMarker.Position.TOP:
			offset.width = -width / 2;
			break
		case goog.maps.RichMarker.Position.TOP_RIGHT:
			offset.width = -width;
			break
		case goog.maps.RichMarker.Position.LEFT:
			offset.height = -height / 2;
			break
		case goog.maps.RichMarker.Position.MIDDLE:
			offset.width = -width / 2;
			offset.height = -height / 2;
			break
		case goog.maps.RichMarker.Position.RIGHT:
			offset.width = -width;
			offset.height = -height / 2;
			break
		case goog.maps.RichMarker.Position.BOTTOM_LEFT:
			offset.height = -height;
			break
		case goog.maps.RichMarker.Position.BOTTOM:
			offset.width = -width / 2;
			offset.height = -height;
			break
		case goog.maps.RichMarker.Position.BOTTOM_RIGHT:
			offset.width = -width;
			offset.height = -height;
			break		
	}
	
	return offset;
}

/**
 * Update content 
 */
goog.maps.RichMarker.prototype.updateContent = function()
{
	if( !this.overlayContent_ )
		return;
		
	//console.log( this.overlayContent_ );
	
	goog.dom.removeChildren( /** @type {Node} */( this.overlayContent_ ) );
	
	var content = this.getContent();
	
	if( content )
	{
		if( 'string' == typeof content )
		{
			//content = content.replace(/^\s*([\S\s]*)\b\s*$/, '$1');
			content = goog.dom.htmlToDocumentFragment( content );
		}
		
		this.overlayContent_.appendChild( content );
		
		var images = goog.dom.getElementsByTagNameAndClass( 'img', null, this.overlayContent_);
		
		for( var i=0, j=images.length; i < j; i++ )
		{
			var image = images[ i ];
			
			this.imageMod( image );
		}
		
	}
	
	google.maps.event.trigger( this.overlay, 'domready');
	
	if( this.ready_ )
	{
		this.draw()
	}
	
}


goog.maps.RichMarker.prototype.updateVisible = function()
{
	if( this.ready_ )
	{
		this.overlayWrapper_.style.display = this.isVisible() ? '' : 'none';
		
		this.draw();
	}
   
}

goog.maps.RichMarker.prototype.updateShadow = function()
{
	
}

/**
 *
 */
goog.maps.RichMarker.prototype.imageMod = function( image )
{
	google.maps.event.addDomListener(image, 'mousedown', goog.bind(function(e)
	{
		if ( this.isDraggable_ )
		{
			if ( e.preventDefault )
			{
				e.preventDefault();
			}
			e.returnValue = false;
        }
	}, this) );
	
	google.maps.event.addDomListener(image, 'load',goog.bind( function()
	{
		this.draw();
	}, this ) );
}