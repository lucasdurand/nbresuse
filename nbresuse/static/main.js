define(['jquery', 'base/js/utils'], function ($, utils) {
    function setupDOM() {

        $('head').append(
            $('<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.8.1/css/all.css" integrity="sha384-50oBUHEmvpQ+1lW4y57PTFmhCaXp0ML5d60M1M7uH2+nqUivzIebhndOJK28anvf" crossorigin="anonymous">')
        )


        // $('#maintoolbar-container').append(
        //     $('<div>').attr('id', 'nbresuse-display-cpu')
        //               .addClass('btn-group')
        //               .addClass('pull-right')
        //     .append(
        //         $('<strong>').text('Total (cpu): ')
        //     ).append(
        //         $('<span>').attr('id', 'nbresuse-cpu')
        //                    .attr('title', 'Actively used CPU cores across all Notebooks (updates every 5s)')
        //     ).append(
        //         $('<i>').addClass('far')
        //     )
        // );
        // // FIXME: Do something cleaner to get styles in here?
        // $('head').append(
        //     $('<style>').html('.nbresuse-warn { background-color: #FFD2D2; color: #D8000C; }')
        // );
        // $('head').append(
        //     $('<style>').html('#nbresuse-display-cpu { padding: 2px 8px; }')
        // );

        $('#maintoolbar-container').append(
            $('<div>').attr('id', 'nbresuse-display')
                      .addClass('btn-group')
                      .addClass('pull-right')
            .append(
                $('<strong>').text('Total (mem): ')
            ).append(
                $('<span>').attr('id', 'nbresuse-mem')
                           .attr('title', 'Actively used Memory in All Notebooks (updates every 5s)')
            ).append(
                $('<i>').addClass('far')
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

        $('#maintoolbar-container').append(
            $('<div>').attr('id', 'nbresuse-display-disk')
                      .addClass('btn-group')
                      .addClass('pull-right')
            .append(
                $('<strong>').text('Disk: ')
            ).append(
                $('<span>').attr('id', 'nbresuse-disk')
                           .attr('title', 'Disk usage in Notebook (updates every 5s)')
            ).append(
                $('<i>').addClass('far')
            )
        );
        $('head').append(
            $('<style>').html('#nbresuse-display-disk { padding: 2px 8px; }')
        );
        $('#maintoolbar-container').append(
            $('<div>').attr('id', 'nbresuse-display-hdfs')
                      .addClass('btn-group')
                      .addClass('pull-right')
            .append(
                $('<strong>').text('HDFS: ')
            ).append(
                $('<span>').attr('id', 'nbresuse-hdfs')
                           .attr('title', 'Storage usage in HDFS (updates every 5s)')
            ).append(
                $('<i>').addClass('far')
            )
        );
        $('head').append(
            $('<style>').html('#nbresuse-display-hdfs { padding: 2px 8px; }')
        );


    }

    var displayMetrics = () => {
        if (document.hidden) {
            // Don't poll when nobody is looking
            return;
        }
        let kernel_obj = Jupyter.notebook.kernel;
        let kernel = kernel_obj ? kernel_obj.id : null;

        $.getJSON(utils.get_body_data('baseUrl') + 'metrics?kernel=' + kernel, function(data) {
            // FIXME: Proper setups for MB and GB. MB should have 0 things
            // after the ., but GB should have 2.
            var display = (data['rss'] / (1024 * 1024 * 1024)).toFixed(2);
            var display_notebook = (data['rss_this_one'] / (1024 * 1024 * 1024)).toFixed(2);
            var display_disk = (data['disk'] / (1024 * 1024 * 1024)).toFixed(2);
            var display_hdfs = (data['hdfs'] / (1024 * 1024 * 1024)).toFixed(2);
            //var display_cpu = (data['cpu']).toFixed(2);
            //var display_notebook_cpu = (data['cpu_this_one']).toFixed(2);

            var limits = data['limits'];

            // if ('cpu' in limits) {
            //     if ('cpu' in limits['cpu']) {
            //         display_cpu += " / " + (limits['cpu']['cpu']);
            //     }
            //     if (limits['cpu']['warn']) {
            //         $('#nbresuse-display-cpu').addClass('nbresuse-warn');
            //         $('#nbresuse-display-cpu i').removeClass('fa-grin-beam');
            //         $('#nbresuse-display-cpu i').addClass('fa-angry');
            //     } else {
            //         $('#nbresuse-display-cpu').removeClass('nbresuse-warn');
            //         $('#nbresuse-display-cpu i').removeClass('fa-angry');
            //         $('#nbresuse-display-cpu i').addClass('fa-grin-beam');
            //     }
            // }

            if ('memory' in limits) {
                if ('rss' in limits['memory']) {
                    display += " / " + (limits['memory']['rss'] / (1024 * 1024 * 1024));
                }
                if (limits['memory']['warn']) {
                    $('#nbresuse-display').addClass('nbresuse-warn');
                    $('#nbresuse-display i').removeClass('fa-grin-beam');
                    $('#nbresuse-display i').addClass('fa-angry');
                } else {
                    $('#nbresuse-display').removeClass('nbresuse-warn');
                    $('#nbresuse-display i').removeClass('fa-angry');
                    $('#nbresuse-display i').addClass('fa-grin-beam');
                }
            }
            if ('disk' in limits) {
                if ('disk' in limits['disk']) {
                    display_disk += " / " + (limits['disk']['disk'] / (1024 * 1024 * 1024));
                }
                if (limits['disk']['warn']) {
                    $('#nbresuse-display-disk').addClass('nbresuse-warn');
                    $('#nbresuse-display-disk i').removeClass('fa-grin-beam');
                    $('#nbresuse-display-disk i').addClass('fa-angry');

                } else {
                    $('#nbresuse-display-disk').removeClass('nbresuse-warn');
                    $('#nbresuse-display-disk i').removeClass('fa-angry');
                    $('#nbresuse-display-disk i').addClass('fa-grin-beam');
                }
            }
            if ('hdfs' in limits) {
                if ('hdfs' in limits['hdfs']) {
                    display_hdfs += " / " + (limits['hdfs']['hdfs'] / (1024 * 1024 * 1024));
                }
                if (limits['hdfs']['warn']) {
                    $('#nbresuse-display-hdfs').addClass('nbresuse-warn');
                    $('#nbresuse-display-hdfs i').removeClass('fa-grin-beam');
                    $('#nbresuse-display-hdfs i').addClass('fa-angry');

                } else {
                    $('#nbresuse-display-hdfs').removeClass('nbresuse-warn');
                    $('#nbresuse-display-hdfs i').removeClass('fa-angry');
                    $('#nbresuse-display-hdfs i').addClass('fa-grin-beam');
                }
            }
            //$('#nbresuse-cpu').text(display_cpu + '%');
            //$('#nbresuse-cpu-notebook').text(display_notebook_cpu + ' %');
            $('#nbresuse-mem').text(display + ' GB');
            $('#nbresuse-mem-notebook').text(display_notebook + ' GB');
            $('#nbresuse-disk').text(display_disk + ' GB');
            $('#nbresuse-hdfs').text(display_hdfs + ' GB');
        });
    };

    var load_ipython_extension = function () {
        setupDOM();
        let before = performance.now();
        displayMetrics();
        let after = performance.now();
        console.log(after-before)
        // Update every five seconds, eh? Unless something wild is happening! Maybe disk size is really big? Then do it every five of the time it takes?
        let interval = 1000 * Math.max(5, (after-before) * 5); 
        setInterval(displayMetrics, interval);

        document.addEventListener("visibilitychange", function() {
            // Update instantly when user activates notebook tab
            // FIXME: Turn off update timer completely when tab not in focus
            if (!document.hidden) {
                displayMetrics();
            }
        }, false);
    };

    return {
        load_ipython_extension: load_ipython_extension,
    };
});
