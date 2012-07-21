/*
* @name     jQuery Accordion Table
* @version  v0.1
* @author   Spencer Rhodes
* @date     July 20, 2012
* @url      https://github.com/oobleck/Accordion-Table-Widget
* @license  MIT
*
* (c) Copyright 2012
*
* Depends:
*   jquery.js 1.7
*   jquery.ui.core.js 1.8
*   jquery.ui.widget.js <version>
*/
;(function ($) {
    var _parent = $.Widget;
    var widgetName = 'accordionTable';
    // Hash of available UI classes
    var uiClasses = {
        closeClass: 'ui-close',
        widgetContainer: 'ui-widget',
        stateCollapsed: 'ui-state-collapsed',
        stateExpanded: 'ui-state-expanded',
        stateDefault: 'ui-state-default',
        stateHover: 'ui-state-hover',
        stateActive: 'ui-state-active',
        stateFocus:  'ui-state-focus'
    };
    uiClasses.manifest = (function() {
                    var classes = [];
                    $.each(uiClasses, function(key, value) {
                        classes.push( value );
                    });
                    return classes;
                })();

    $.widget('oobleck.'+ widgetName, {
        // Default options
        options: {
            // Animation type (slide, toggle, or fade)
            animation: 'slide',
            // Animation speed
            speed: 200,
            // Add a close button?
            addClose: true,
            // Tempalte markup for close button
            closeButton: '<a href="#" class="close trigger">close</a>',
            // Copy TH from trigger row?
            copyHeaders: false,
            // Visible row selector
            parentSelector: 'tr.parent',
            // Detail row selector
            detailSelector: 'tr.detail',
            // Trigger selector
            detailTrigger: '.trigger',
            // Wrapper around the detail contents to facilitate
            //   animation (can't animate table elements).
            detailWrapperClass: '.drawer',
            // Whole row is a trigger for details?
            wholeRowTrigger: true,
            // Calcualte columns automatically?
            //   Don't need. Make smarter
            calculateColspan: true,
            // Detail row will obscure/hide parent row?
            obscureParent: false,
            // Collapsed on initialization?
            initCollapsed: true,
            // Callbacks
            afterDestroy: false, // callback after destroy completes
            afterEachRow: false, // function ( row ) {},
            afterAll: false, // function ( objs ) {},
            afterShow: false, // function( event ) {},
            afterHide: false // function( event ) {}
        },

        // Fired the first time the widget is called on an element. Hook up events,
        _create: function() {
            // this.element = element widget is invoked on
            // this.options = merged options hash
            // var $elem = this.element;
            var _this = this;
            var options = _this.options;
            this.parentRows = $(this.element.find( options.parentSelector ));
            this.detailRows = $(this.element.find( options.detailSelector ));
            var eventElement = ( options.wholeRowTrigger ) ? options.parentSelector : options.detailTrigger;

            $(this.element).addClass( uiClasses.widgetContainer );
            // Setup each row
            $.each( this.parentRows, function( i, el ) {
                var $pRow = $(el);
                var $dRow = $pRow.next( options.detailSelector );
                var $rowPair = $pRow.add($dRow);
                var $dTd = $dRow.find('td');
                var $trigger = $pRow.find( options.detailTrigger );
                var drawerClass = options.detailWrapperClass.replace(/^\./, "");
                var $closeElement;

                // Attach the detail row jQ ref to the elements
                $pRow.data( 'detailRow', $dRow );
                $trigger.data( 'detailRow', $dRow );
                $dRow.data( 'parentRow', $pRow )

                // Add UI classes to rows
                $rowPair.addClass( uiClasses.stateCollapsed );

                // Copy TH contents from parent to detail?
                if ( options.copyHeaders ) {
                    $dRow.find('th,td').eq(0).html( $pRow.find('th,td').eq(0).html() );
                }
                // wrap the contents with a hidden div for animation
                if ( !$dTd.find( options.detailWrapperClass ).length ) {
                    $dTd.wrapInner('<div class="' + drawerClass + '" />');
                    ( options.initCollapsed ) && $dTd.find( options.detailWrapperClass ).hide();
                }
                // Add the close button to the detail view?
                if ( options.addClose ) {
                    $closeElement = $(options.closeButton);
                    $closeElement.addClass( uiClasses.closeClass );
                    $dTd.find( options.detailWrapperClass ).append( $closeElement );
                }
                // Set colspan if one isn't provided?
                if ( options.calculateColspan
                    && $dTd.length === 1
                    && ( !$dTd.attr('colspan')
                        // This fall through (OR) check is because IE8 assumes all
                        // TDs have a colspan, specified or not
                        || $dTd.attr('colspan') <= 1 )
                    ) {
                    $dTd.attr('colspan', $pRow.find('td').length);
                }
                // if whole row is the trigger?
                if ( options.wholeRowTrigger ) {
                    _this.parentRows.css('cursor', 'pointer');
                }
                // Execute callback after each row is processed
                _this._trigger( 'afterEachRow', $rowPair );
            });

            // Events
            $(document)
                .on('click.'+ widgetName, eventElement, function( e ) {
                    e.preventDefault();
                    var $this = $(this);
                    var $detail = $this.data( 'detailRow' );
                    var $parent = $detail.data( 'parentRow' );
                    var state = ( $detail.find( options.detailWrapperClass ).is(':hidden') ) ? 'show' : 'hide';
                    // Fire one of the methods
                    if ( state === 'show' ) {
                        _this._showDetail.apply(_this, [ $parent, $detail, state ]);
                    } else {
                        _this._hideDetail.apply(_this, [ $parent, $detail, state ]);
                    }
                    return e;
                })
                .on('mouseenter.'+widgetName, eventElement, function( e ) {
                    e.preventDefault();
                    $(this)
                        .addClass( uiClasses.stateHover )
                        .removeClass( uiClasses.stateDefault );
                })
                .on('mouseleave.'+widgetName, eventElement, function( e ) {
                    e.preventDefault();
                    $(this)
                        .removeClass( uiClasses.stateHover )
                        .addClass( uiClasses.stateDefault );
                });

            // If addCLose, setup event
            if ( options.addClose ) {
                $(document).on( 'click.'+ widgetName, _this.options.detailSelector + ' ' + _this.options.detailTrigger, function( e ) {
                    var $this = $(this);
                    e.stopPropagation();
                    e.preventDefault();
                    $this.parents('tr').data( 'parentRow' ).find( _this.options.detailTrigger ).click();
                });
            }

            // Internal events
            for ( event in _this._events ) {
                if ( _this._events.hasOwnProperty( event ) ) {
                    _this.element.on( event +'.'+ widgetName, _this.options[event] );
                }
            }

            // Execute callback after the table is processed
            _this._trigger( 'afterAll', this.element );
        },

        // Determine if we're sliding, fading, or toggling,and what direction.
        // TODO: Figure out a way to cache this? Maybe currying?
        _getToggleMethod: function( state ) {
            switch ( this.options.animation ) {
                case 'fade':
                    return ( state === 'show' ) ? 'fadeIn' : 'fadeOut';
                case 'slide':
                    return ( state === 'show' ) ? 'slideDown' : 'slideUp';
                default:
                    return state;
            }
        },
        _showDetail: function( $parent, $detail, state ) {
            var _this;
            $detail.add($parent)
                .removeClass( uiClasses.stateCollapsed )
                .addClass( uiClasses.stateExpanded );
            _this = this;
            // Toggle parent row visibility?
            ( _this.options.obscureParent ) && $parent.hide();
            $detail.find( _this.options.detailWrapperClass )
                [ _this._getToggleMethod( state ) ]( _this.options.speed, function() {
                    _this._trigger('afterShow');
                });
        },
        _hideDetail: function( $parent, $detail, state ) {
            var _this;
            // capture the widget object
            _this = this;
            // Toggle detail row visibility
            $detail.find( _this.options.detailWrapperClass )
                [ _this._getToggleMethod( state ) ]( _this.options.speed, function() {
                    $detail.add($parent)
                        .addClass( uiClasses.stateCollapsed )
                        .removeClass( uiClasses.stateExpanded );
                    // Toggle parent row visibility?
                    ( _this.options.obscureParent ) && $parent.show();
                    _this._trigger('afterHide');
                });
        },
        _hover: function( e ) {
            // toggle .ui-state-hover class
        },

        // Setup
        // _init: function() {},

        // Augment option setting method
        _setOption: function( option, value ) {
            var oldValue = this.options[ option ];
            var _this = this;
            switch ( option ) {
                // case 'addClose':
                //     break;
                // case 'closeButton':
                //     break;
                // case 'copyHeaders':
                //     break;
                // case 'parentSelector':
                //     break;
                // case 'detailSelector':
                //     break;
                // case 'detailTrigger':
                //     break;
                case 'detailWrapperClass':
                    // TODO: Breaks click events
                    var row, contents;
                    for ( row in this.detailRows ) {
                        $(row).find( this.options.detailWrapperClass )
                            .toggleClass( this.options.detailWrapperClass.replace(/[\.\#]/, '') +' '+ value);
                    }
                    break;
                // case 'wholeRowTrigger':
                //     // Can this be changed?
                //     break;
                // case 'calculateColspan':
                //     break;
                default:
                    return "No option: " + option;
            }
            _parent.prototype._setOption.apply(this, arguments);
        },

        // Remove and cleanup after the widget. Unbind events, serialize data, remove HTML components
        destroy: function() {
            var _this = this;
            this.detailRows.each(function(i, el) {
                var $row = $(el);
                var $tds = $('td', $row);
                var $td;
                if ( _this.options.calculateColspan ) {
                    $tds.each(function(ii, ell) {
                        var td = $(ell);
                        var cols = td.prop('colspan') || 1;
                        if ( cols > 1 ) {
                            td.removeAttr('colspan');
                        }
                    });

                }
            });
            // Remove close buttons
            if ( _this.options.addClose ) {
                // remove close button
                $(this.element).find('.'+uiClasses.closeClass).detach();
            }
            // Remove drawer wrappers
            if ( _this.options.detailWrapperClass ) {
                $(this.element).find( _this.options.detailWrapperClass ).children().unwrap();
            }

            // Remove UI classes
            this.parentRows.add(this.detailRows)
                .css( 'cursor', '' )
                .removeClass( uiClasses.manifest.join(' ') )
                .show();

            // Unbind general UI events
            $(document).unbind( '.'+widgetName );

            $(this.element).removeClass( uiClasses.widgetContainer );
            // Call parent method
            this._trigger('afterDestroy');
            _parent.prototype.destroy.call(this);
        }
    });
})(jQuery);