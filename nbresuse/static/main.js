define(['jquery', 'base/js/utils'], function ($, utils) {
    function setupDOM() {
        $('#maintoolbar-container').append(
            $('<div>').attr('id', 'nbresuse-display')
                      .addClass('btn-group')
                      .addClass('pull-right')
            .append(
                $('<strong>').text('Total: ')
            ).append(
                $('<span>').attr('id', 'nbresuse-mem')
                           .attr('title', 'Actively used Memory in All Notebooks (updates every 5s)')
            )
        );
        // FIXME: Do something cleaner to get styles in here?
        $('head').append(
            $('<style>').html('.nbresuse-warn { background-color: #FFD2D2; color: #D8000C; }')
        );
        $('head').append(
            $('<style>').html('#nbresuse-display { padding: 2px 8px; }')
        );
        $('#maintoolbar-container').append(
            $('<div>').attr('id', 'nbresuse-display')
                      .addClass('btn-group')
                      .addClass('pull-right')
            .append(
                $('<strong>').text('Memory: ')
            ).append(
                $('<span>').attr('id', 'nbresuse-mem-notebook')
                           .attr('title', 'Actively used Memory in this Notebook (updates every 5s)')
            )
        );
        // FIXME: Do something cleaner to get styles in here?
        $('head').append(
            $('<style>').html('.nbresuse-warn { background-color: #FFD2D2; color: #D8000C; }')
        );
        $('head').append(
            $('<style>').html('#nbresuse-display { padding: 2px 8px; }')
        );

    }

    var displayMetrics = function() {

        $.getJSON(utils.get_body_data('baseUrl') + 'api/sessions', function(data) {
            var notebook_name = window.location.pathname.split('/notebooks/')[1];
            var session = data.filter((item) => {return item['path']===notebook_name});
            var kernel = session[0]['kernel']['id'];
            //now get the usage info for this kernel and total
            $.getJSON(utils.get_body_data('baseUrl') + 'metrics?kernel=' + kernel, function(data) {
                // FIXME: Proper setups for MB and GB. MB should have 0 things
                // after the ., but GB should have 2.
                var display = Math.round(data['rss'] / (1024 * 1024));
                var display_notebook = Math.round(data['rss_this_one'] / (1024 * 1024));

                var limits = data['limits'];
                if ('memory' in limits) {
                    if ('rss' in limits['memory']) {
                        display += " / " + (limits['memory']['rss'] / (1024 * 1024));
                    }
                    if (limits['memory']['warn']) {
                        $('#nbresuse-display').addClass('nbresuse-warn');
                    } else {
                        $('#nbresuse-display').removeClass('nbresuse-warn');
                    }
                }
                if (data['limits']['memory'] !== null) {
                }
                $('#nbresuse-mem').text(display + ' MB');
                $('#nbresuse-mem-notebook').text(display_notebook + ' MB');
            });
        });

    }

    var load_ipython_extension = function () {
        setupDOM();
        displayMetrics();
        // Update every five seconds, eh?
        setInterval(displayMetrics, 1000 * 5);
    };

    return {
        load_ipython_extension: load_ipython_extension,
    };
});
