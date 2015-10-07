# coding: utf-8

from mod_python import apache  # @UnresolvedImport

import time
import os
import json
import netCDF4  # @UnresolvedImport
import urllib
import datetime


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def readData(req, fileType="1", dimCols="time,p,lat,lon", varCols="temp,rh", gridStep=5, zAdjustment=1000):
	dimCols = dimCols.split(",")
	varCols = varCols.split(",")
	gridStep=int(gridStep)
	zAdjustment=int(zAdjustment)
	# select file type
	if fileType=="1":
		fileType = "MSM-P"
	elif fileType=="2":
		fileType = "MSM-S"
	elif fileType=="3":
		fileType = "RSM-P"
	elif fileType=="4":
		fileType = "RSM-S"
	d = datetime.datetime.now()
	d -= datetime.timedelta(days = 3)
	fileName= d.strftime('%m%d') + ".nc"
	filePath = "./data/" + fileType + "/" + d.strftime('%Y') + "/"
	# converted to an absolute path
	folderPath = getAbsPath(os.path.dirname(os.path.abspath(__file__)), filePath)+"/"
	if os.path.isdir(folderPath)==False:
		os.makedirs(folderPath)
	if os.path.exists(folderPath+fileName) ==False:
		try:
			# please be replaced in the path of netcdf file that your have
			netcdfUrl="http://database.rish.kyoto-u.ac.jp/arch/jmadata/data/gpv/netcdf/" + fileType + "/" + d.strftime('%Y') + "/"+fileName
			urllib.urlretrieve(netcdfUrl, folderPath+fileName)
		except IOError:
			print u"failed to get.".encode("utf-8")
			return json.dumps({"error":u"failed to get.".encode("utf-8")})
		
	f = netCDF4.Dataset(folderPath+fileName, 'r')
	lonList = f.variables[dimCols[3]][:]
	latList = f.variables[dimCols[2]][:]
	pList = f.variables[dimCols[1]][:]*zAdjustment	# z-scale adjustment
	timeList = f.variables[dimCols[0]][:]
	varHash={}
	for var in varCols:
		varHash[var] = f.variables[var][:]
	zAdjustment=int(zAdjustment)
	latCnt=0
	lonCnt=0
	allVarHash = {}
	dimList = []
	ntime, nnp, nlat, nlon  = varHash[varCols[0]].shape
	for time in range(0, ntime):
		allVarHash[str(timeList[time])]={}
		tmpVar=allVarHash[str(timeList[time])]
		for var in varCols:
			tmpVar[var]=[]
		for p in range(0, nnp-1):
			for lat in range(0, nlat-1):
				latCnt+=1
				if latCnt==gridStep:
					latCnt=0
					for lon in range(0, nlon-1):
						lonCnt+=1
						if lonCnt==gridStep:
							lonCnt=0
							if time==0 : dimList.append([lon,lat,p])
							for var in varCols:
								tmpValue = str(varHash[var][time, p, lat, lon])
								if tmpValue != "" and tmpValue != "-" and tmpValue != "--":
									tmpVar[var].append(str(tmpValue)+ " 0")
						else:
							continue
				else:
					continue
	f.close()
	return json.dumps({"time":map(str,list(timeList)),"dim":dimList,"dimHash":\
		{"lon":map(str,list(lonList)),"lat":map(str,list(latList)),"p":map(str,list(pList))},"var":allVarHash});



def getAbsPath(basepath, relativepath):
	current = os.getcwd();
	os.chdir(basepath)
	abspath = os.path.abspath(relativepath)
	os.chdir(current)
	return abspath