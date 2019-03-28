import os
import json
import psutil
from traitlets import Float, Int, default
from traitlets.config import Configurable
from notebook.utils import url_path_join
from notebook.base.handlers import IPythonHandler

import subprocess
import hdfs
import pandas as pd
from io import BytesIO

class MetricsHandler(IPythonHandler):
    def get(self):
        """
        Calculate and return current resource usage metrics
        """
        kernel = self.get_argument('kernel',None)
        config = self.settings['nbresuse_display_config']
        cur_process = psutil.Process()
        all_processes = [cur_process] + cur_process.children(recursive=True)
        rss = sum([p.memory_info().rss for p in all_processes])

        this_one = list(filter(lambda x: self.get_kernel(x.as_dict()['cmdline'][-1]) == kernel,all_processes))
        this_rss = this_one[0].memory_info().rss if this_one else "??"
        limits = {}

        # for linux, try and get home drive usage (particularly useful for JupyterHub)
        home = os.path.expanduser('~/') #or use os.environ['HOME'] ?
        du = subprocess.Popen(f'du -s {home}',stdout=subprocess.PIPE, shell=True).communicate()
        try:
            disk = pd.read_csv(BytesIO(du[0]),sep='\t', names=['used','user'])
            disk_used = int(disk['used'][0]*1024) #initially in MB
        except:
            disk_used = 8e10

        # HDFS limits
        hdfs_used = 0
        if config.hdfs_url:
            try:
                client = hdfs.InsecureClient(config.hdfs_url, user=config.hdfs_user)
                content = client.content(os.path.join(config.hdfs_path,config.user))
                hdfs_used = content['length'] / 1000
            except:
                pass

        if config.mem_limit != 0:
            limits['memory'] = {
                'rss': config.mem_limit
            }
            if config.mem_warning_threshold != 0:
                limits['memory']['warn'] = (config.mem_limit - rss) < (config.mem_limit * config.mem_warning_threshold)

        if config.disk_limit != 0:
            limits['disk'] = {
                'disk': config.disk_limit,
            }
            if config.disk_warning_threshold != 0:
                limits['disk']['warn'] = (config.disk_limit - disk_used) < (config.disk_limit * config.disk_warning_threshold)                

        if config.hdfs_limit != 0:
            limits['hdfs'] = {
                'hdfs': config.hdfs_limit,
                'warn': 0.9*config.hdfs_limit < hdfs_used
            }

        metrics = {
            'rss': rss,
            'limits': limits,
            'rss_this_one': this_rss,
            'kernel': kernel,
            'disk': disk_used,
            'hdfs': hdfs_used
        }
        self.write(json.dumps(metrics))


    def get_kernel(self, cmd):
        kernel_file = os.path.split(cmd)[-1]
        return kernel_file.replace('kernel-','').replace('.json','')


def _jupyter_server_extension_paths():
    """
    Set up the server extension for collecting metrics
    """
    return [{
        'module': 'nbresuse',
    }]

def _jupyter_nbextension_paths():
    """
    Set up the notebook extension for displaying metrics
    """
    return [{
        "section": "notebook",
        "dest": "nbresuse",
        "src": "static",
        "require": "nbresuse/main"
    }]

class ResourceUseDisplay(Configurable):
    """
    Holds server-side configuration for nbresuse
    """

    mem_warning_threshold = Float(
        0.1,
        help="""
        Warn user with flashing lights when memory usage is within this fraction
        memory limit.

        For example, if memory limit is 128MB, `mem_warning_threshold` is 0.1,
        we will start warning the user when they use (128 - (128 * 0.1)) MB.

        Set to 0 to disable warning.
        """,
        config=True
    )

    disk_warning_threshold = Float(
        0,
        help="""
        Warn user with flashing lights when disk usage is within this fraction
        memory limit.
        """,
        config=True
    )

    mem_limit = Int(
        0,
        config=True,
        help="""
        Memory limit to display to the user, in bytes.

        Note that this does not actually limit the user's memory usage!

        Defaults to reading from the `MEM_LIMIT` environment variable. If
        set to 0, no memory limit is displayed.
        """
    )

    disk_limit = Int(
        0,
        config=True,
        help="""
        Disk space limit to display to the user, in bytes.

        Defaults to reading from the `DISK_LIMIT` environment variable. If
        set to 0, no limit is displayed.
        """
    )

    hdfs_limit = Int(
        0,
        config=True,
        help="""
        HDFS space limit to display to the user, in bytes.

        Defaults to reading from the `HDFS_LIMIT` environment variable. If
        set to 0, no limit is displayed.
        """
    )

    @default('hdfs_limit')
    def _hdfs_limit_default(self):
        return int(os.environ.get('HDFS_LIMIT', 0))

    hdfs_path = os.environ.get('HDFS_PATH', '')

    hdfs_user = os.environ.get('HDFS_USER', '')

    hdfs_url = os.environ.get('HDFS_URL', '')

    @default('mem_limit')
    def _mem_limit_default(self):
        return int(os.environ.get('MEM_LIMIT', 0))

    @default('disk_limit')
    def _disk_limit_default(self):
        return int(os.environ.get('DISK_LIMIT', 0))

    user = os.environ.get('USER','')

def load_jupyter_server_extension(nbapp):
    """
    Called during notebook start
    """
    resuseconfig = ResourceUseDisplay(parent=nbapp)
    nbapp.web_app.settings['nbresuse_display_config'] = resuseconfig
    route_pattern = url_path_join(nbapp.web_app.settings['base_url'], '/metrics')
    nbapp.web_app.add_handlers('.*', [(route_pattern, MetricsHandler)])
