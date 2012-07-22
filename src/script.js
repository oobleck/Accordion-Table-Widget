;(function($) {
    options = {
        // wholeRowTrigger: false
    };
    tmp = $('table.expandable').accordionTable( options );
    $(document)
        .on('click', '.toggleWidget', function( e ) {
            e.preventDefault();
            if ( tmp && tmp.data('accordionTable') ) {
                tmp.accordionTable('destroy');
            } else {
                tmp = $('table.expandable').accordionTable( options );
            }
        })
        .on('click', '.addWidget', function( e ) {
            e.preventDefault();
            tmp = $('table.expandable').accordionTable( options );
        })
        .on('click', '.destroyWidget', function( e ) {
            e.preventDefault();
            $('table.expandable').accordionTable('destroy');
        });
})(jQuery);