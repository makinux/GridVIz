# GridVIz

GRID VIZ makes possible easy visualization of NetCDF data with longitude and latitude. GRID VIZ visualizes volume using the billboard feature of Cesium. It's a rather simple mechanism, but because it allows you to quickly give form to your ideas, it makes Cesium the best tool for data visualization.

GRID VIZ uses four-dimensional (time, longitude, latitude, and atmospheric pressure) data from the Japan Meteorological Agency. Users can visualize the variable space they want to observe by filtering each variable and moving the time axis. Also, when filtering with variables, they can view the distribution of data intuitively by dividing the spaces by color into quartiles.

For more information see http://cesiumjs.org/demos/GridViz.html
video https://www.youtube.com/watch?v=-SazQPD4tgM

## Require

We tested GRID VIZ on CentOS6.5 configurations.

And required python2.7,netcdf-python
(https://code.google.com/p/netcdf4-python/).

example

    yum clean all
    yum update yum
    yum update curl
    yum update openssl
    yum update nss
    yum install epel-release
    wget https://dl.iuscommunity.org/pub/ius/stable/CentOS/6/x86_64/ius-release-1.0-15.ius.centos6.noarch.rpm
    rpm -Uvh ius-release-1.0-15.ius.centos6.noarch.rpm
    yum install hdf5-devel netcdf-devel python27-setuptools python27-pip python27-devel gcc libcurl-devel mod_python
    pip2.7 install numpy==1.14.6
    pip2.7 install cython
    pip2.7 install netCDF4

## Usage

Users filter for the desired data by controlling the slide bar. The TIME slide is fixed, but the other slide bars change according to the varCols of the GET parameter of the URL. The default display is a quartile of the variable farthest to the left, but when users change the range of the variable, it will then display the quartile of the selected variable. gridStep, from the URL parameter, shows the degree of fineness of longitude and latitude. To quickly see the overview, they increase the gridStep of the URL parameter; to view at smaller increments, users decrease the parameter.

example url

     http://[server ip]/grid_viz.html?fileType=1&varCols=temp,rh&gridStep=5&zAdjustment=1000


