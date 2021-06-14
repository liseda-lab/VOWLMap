import json
import re
import sys

def alignmentInfo(alignment):
    """ 
    Receives an aligment of 2 ontologies and put the information about each mapping in a dictionary.

    Requires:alignment is the name of the rdf file.
    Ensures: dictionary in which every tuple (source class, target class) correspondes to a tuple (score, status)
    """
    mappings={}
    source=[]
    target=[]
    scores=[]
    status=[]

    align=open(alignment, "r")
    lines=align.readlines()

    #find target and source classes for each mapping and store them
    for line in range(len(lines)):
        src= '<entity1.*="(.*)"/>'
        tgt= '<entity2.*="(.*)"/>'
        score='<measure.*>(.*)</measure>'
        stat='<status.*>(.*)</status>'

        if re.findall(src, lines[line]) != []:
            source.append(re.findall(src, lines[line])[0])

        if re.findall(tgt, lines[line]) != []:
            target.append(re.findall(tgt, lines[line])[0])

        if re.findall(score, lines[line]) != []:
            scores.append(re.findall(score, lines[line])[0])
            if re.findall(stat, lines[line+3]) !=[]:
                status.append(re.findall(stat, lines[line+3])[0])
            else:
                status.append("unreviewed")

    align.close()

    i=0
    while i<len(source):
        mappings[source[i],target[i]]=(scores[i],status[i])
        i+=1

    return mappings


def sortIds(data):
    srcIds=[]
    for c in data['class']:
        srcIds.append(c['id'])

    for p in data['property']:
        srcIds.append(p['id'])

    srcIds.sort(key=int)

    return srcIds


def getId(attr, iri):
    """ 
    Receives a list of the attributes of all classes and an iri for a specific class and returns the corresponding id.

    Requires:attr is a list of dictionaries with attributes of each class, iri is a str.
    Ensures: id corresponding to the class with that iri.
    """
    idd=''
    for e in attr:
        if 'iri' in e.keys():
            if e['iri']==iri:
                idd=e['id']
    return idd


def merge2Ontos(srcFileName, tgtFileName):
    onto1=srcFileName.split(".")[0]
    onto2=tgtFileName.split(".")[0]
    mergedOnto={}

    with open(srcFileName) as srcFile:
        srcData= json.load(srcFile)

    with open(tgtFileName) as tgtFile:
        tgtData= json.load(tgtFile)

    sortedIds=sortIds(srcData)

    for i in srcData:
        for j in tgtData:
            if i==j:
                if srcData[i]==tgtData[j]:
                    mergedOnto[i]=srcData[i]
                elif i=='header':
                    srcData[i]['baseIris'][0]='http://' + onto1 + '_' + onto2 + '.owl'
                    srcData[i]['iri']='http://' + onto1 + '_' + onto2 + '.owl'
                    mergedOnto[i]=srcData[i]
                    srcData[i]['source'] = 'http://' + onto1 + '.owl'
                    srcData[i]['target'] = 'http://' + onto2 + '.owl'

                else:
                    for target in tgtData['class']:

                        #verifies if the target class id already exists in the source classes ids. If yes, changes it.
                        if target['id'] in sortedIds:
                            newID=str(int(sortedIds[-1])+1)

                            for classAtrb in tgtData['classAttribute']:
                                if classAtrb['id']==target['id']:
                                    classAtrb['id']=newID
                                if 'superClasses' in classAtrb:
                                    for s in classAtrb['superClasses']:
                                        if target['id']==s:
                                            classAtrb['superClasses'].remove(s)
                                            classAtrb['superClasses'].append(newID)

                                if 'subClasses' in classAtrb:
                                    for s in classAtrb['subClasses']:
                                        if target['id']==s:
                                            classAtrb['subClasses'].remove(s)
                                            classAtrb['subClasses'].append(newID)

                                if 'union' in classAtrb:
                                    for s in classAtrb['union']:
                                        if target['id']==s:
                                            classAtrb['union'].remove(s)
                                            classAtrb['union'].append(newID)

                                if 'intersection' in classAtrb:
                                    for s in classAtrb['intersection']:
                                        if target['id']==s:
                                            classAtrb['intersection'].remove(s)
                                            classAtrb['intersection'].append(newID)

                                if 'equivalent' in classAtrb:
                                    for s in classAtrb['equivalent']:
                                        if target['id']==s:
                                            classAtrb['equivalent'].remove(s)
                                            classAtrb['equivalent'].append(newID)

                                if 'complement' in classAtrb:
                                    for s in classAtrb['complement']:
                                        if target['id']==s:
                                            classAtrb['complement'].remove(s)
                                            classAtrb['complement'].append(newID)



                                #to get ontologies with != colors we must have external atribute
                                if 'attributes' in classAtrb and 'external' not in classAtrb['attributes']:
                                    classAtrb['attributes'].append('external')
                                if 'attributes' not in classAtrb:
                                    classAtrb['attributes']=['external']

                            for p in tgtData['propertyAttribute']:
                                if p['range']==target['id']:
                                    p['range']=newID
                                if p['domain']==target['id']:
                                    p['domain']=newID


                            target['id']=newID
                            sortedIds.append(newID)

                        #fazer else para as cores aqui!


                    for target in tgtData['property']:
                        if target['id'] in sortedIds:
                            newID=str(int(sortedIds[-1])+1)
                            for pa in tgtData['propertyAttribute']:
                                if pa['id']==target['id']:
                                    pa['id']=newID
                                if 'inverse' in pa:
                                    if pa['inverse']==target['id']:
                                        pa['inverse']=newID
                                if 'subproperty' in pa:
                                    for s in pa['subproperty']:
                                        if s == target['id']:
                                            pa['subproperty'].remove(s)
                                            pa['subproperty'].append(newID)
                                if 'superproperty' in pa:
                                    for s in pa['superproperty']:
                                        if s==target['id']:
                                            pa['superproperty'].remove(s)
                                            pa['superproperty'].append(newID)

                                if 'equivalent' in pa:
                                     for s in pa['equivalent']:
                                        if s==target['id']:
                                            pa['equivalent'].remove(s)
                                            pa['equivalent'].append(newID)    

                            target['id']=newID
                            sortedIds.append(newID)
                            
                    mergedOnto[i]=srcData[i]+tgtData[j]

    return mergedOnto

def distanceAt3(onto, links):
    mappingnodes=[]
    propertiesIds=[]
    classesIDs=[]

    for i in links:
        if i[0] not in mappingnodes:
            mappingnodes.append(i[0])
        if i[1] not in mappingnodes:
            mappingnodes.append(i[1])
    
    allnodes=mappingnodes
    i=0

    while i<3:
        if i==0:
            for o in onto['propertyAttribute']:
                if o['range'] in mappingnodes and o['domain'] not in allnodes:
                    allnodes.append(o['domain'])

                if o['domain'] in mappingnodes and o['range'] not in allnodes:
                    allnodes.append(o['range'])
        else:
            nodes=allnodes
            for o in onto['propertyAttribute']:
                if o['range'] in nodes and o['domain'] not in allnodes:
                    allnodes.append(o['domain'])

                if o['domain'] in nodes and o['range'] not in allnodes:
                    allnodes.append(o['range'])
        i+=1


    for o in onto['class']:
        if o['id'] not in allnodes:
            classesIDs.append(o['id'])
            onto['class'].remove(o)
    
    for o in onto['classAttribute']:
        if o['id'] not in allnodes:
            onto['classAttribute'].remove(o)

        if 'superClasses' in o:
            for i in o['superClasses']:
                if i in classesIDs:
                    o['superClasses'].remove(i)
        
        if 'subClasses' in o:
            for i in o['subClasses']:
                if i in classesIDs:
                    o['subClasses'].remove(i)

        if 'equivalent' in o:
            for i in o['equivalent']:
                if i in classesIDs:
                    o['equivalent'].remove(i)
        
        if 'union' in o:
            for i in o['union']:
                if i in classesIDs:
                    o['union'].remove(i)

        if 'intersection' in o:
            for i in o['intersection']:
                if i in classesIDs:
                    o['intersection'].remove(i)

        if 'complement' in o:
            for i in o['complement']:
                if i in classesIDs:
                    o['complement'].remove(i)
                                

    for p in onto['propertyAttribute']:
        if p['range'] not in allnodes or p['domain'] not in allnodes:
            propertiesIds.append(p['id'])
            onto['propertyAttribute'].remove(p)

    for p in onto['property']:
        if p['id'] in propertiesIds:
            onto['property'].remove(p)
    
    for p in onto['propertyAttribute']:
        if 'superproperty' in p:
            for i in p['superproperty']:
                if i in propertiesIds:
                    p['superproperty'].remove(i)

        if 'subproperty' in p:
            for i in p['subproperty']:
                if i in propertiesIds:
                    p['subproperty'].remove(i)
                    
        if 'equivalent' in p:
            for i in p['equivalent']:
                if i in propertiesIds:
                    p['equivalent'].remove(i)
                    
        if 'inverse' in p:
            for i in p['inverse']:
                if i in propertiesIds:
                    p['inverse'].remove(i)


    return onto

def merger(srcFileName, tgtFileName, alignFileName):
    onto1=srcFileName.split(".")[0]
    onto2=tgtFileName.split(".")[0]
    finalname=onto1+"2"+onto2+".json"
    mappings=alignmentInfo(alignFileName)
    mergedOnto=merge2Ontos(srcFileName, tgtFileName)
    allIds=sortIds(mergedOnto)

    links=[]

    
    for c in mappings:

        pId=str(int(allIds[-1])+1)
        pId2=str(int(allIds[-1])+2)

        mergedOnto['property'].append({'id':pId, 'type':'owl:ObjectProperty'})
        mergedOnto['property'].append({'id':pId2, 'type':'owl:ObjectProperty'} )
        sourceId=getId(mergedOnto['classAttribute'],c[0])
        targetId=getId(mergedOnto['classAttribute'],c[1])

        mapping={'iri':'http://'+onto1+'_'+onto2+'.owl#mapping', 'baseIri':'http://'+onto1+'_'+onto2+'.owl', 'range':sourceId, 'label':{'undefined': 'mapping'},'inverse':pId2, 'domain':targetId, 'attributes':['object'],
    "annotations":{"score":[{"identifier":"Score","language":"undefined","value":mappings[c][0],"type":"label"}], "status":[{"identifier":"Status","language":"undefined","value":mappings[c][1],"type":"label"}]},'id':pId}
        inverse={'iri':'http://'+onto1+'_'+onto2+'.owl#mapping', 'baseIri':'http://'+onto1+'_'+onto2+'.owl', 'range':targetId,'label':{'undefined': 'mapping'},'inverse':pId, 'domain':sourceId, 'attributes':['object'],
    "annotations":{"score":[{"identifier":"Score","language":"undefined","value":mappings[c][0],"type":"label"}], "status":[{"identifier":"Status","language":"undefined","value":mappings[c][1],"type":"label"}]}, 'id':pId2}

        mergedOnto['propertyAttribute'].append(mapping)
        mergedOnto['propertyAttribute'].append(inverse)
        allIds.extend([pId,pId2])
        links.append((sourceId,targetId))
        links.append((targetId,sourceId))

    
    if len(mergedOnto['class'])>=5000:
        mergedOnto=distanceAt3(mergedOnto, links)

    with open(finalname,'w') as mergedFile:
        json.dump(mergedOnto, mergedFile, indent=2)




# def JSON2RDF(jsonFileName):
#     """ 
#     Receives a JSON file generated from webVOWL tool, which contains 2 ontologies and the alignment between them
#     and creates a rdf file with the alignment between the 2 ontologies.

#     Requires:jsonFileName is the name of the JSON file.
#     Ensures: rdf file with aligment
#     """
#     jsonFile=jsonFileName.split(".")[0]
#     fileName=jsonFile+".rdf"
#     onto1=""
#     onto2=""
#     mappings={}

#     with open(jsonFileName) as jsonFile:
#         data= json.load(jsonFile)

#     alignment=open(fileName,"w")
#     alignment.write("<?xml version='1.0' encoding='utf-8'?> \n<rdf:RDF xmlns='http://knowledgeweb.semanticweb.org/heterogeneity/alignment'\n\txmlns:rdf='http://www.w3.org/1999/02/22-rdf-syntax-ns#'\n\txmlns:xsd='http://www.w3.org/2001/XMLSchema#'>\n")
#     alignment.write("\n<Alignment>\n")
#     alignment.write("\t<xml>yes</xml>\n")
#     alignment.write("\t<level>0</level>\n")
#     alignment.write("\t<type>??</type>\n")

#     for i in data['propertyAttribute']:
#         if 'label' in i.keys() and type(i['label'])==dict:
#             if 'undefined' in i['label'].keys() and i['label']['undefined']=='mapping':
#                 if (getIri(i['domain'],data['classAttribute']),getIri(i['range'],data['classAttribute'])) not in mappings.keys():
#                     mappings[(getIri(i['range'],data['classAttribute']),getIri(i['domain'],data['classAttribute']))]=(i['annotations']['score'][0]['value'],i['annotations']['status'][0]['value'])
#                     onto1=getIri(i['range'],data['classAttribute']).split("#")[0]
#                     onto2=getIri(i['domain'],data['classAttribute']).split("#")[0]

#     alignment.write("\t<onto1>"+onto1+"</onto1>\n",)
#     alignment.write("\t<onto2>"+onto2+"</onto2>\n")
#     alignment.write("\t<uri1>"+onto1+"</uri1>\n")
#     alignment.write("\t<uri2>"+onto2+"</uri2>\n")

#     for j in mappings:
#         alignment.write("\t<map>\n")
#         alignment.write("\t\t<Cell>")
#         alignment.write('\n\t\t\t<entity1 rdf:resource="'+j[0]+'"/>')
#         alignment.write('\n\t\t\t<entity2 rdf:resource="'+j[1]+'"/>')
#         alignment.write('\n\t\t\t<measure rdf:datatype="http://www.w3.org/2001/XMLSchema#float">'+mappings[j][0]+"</measure>")
#         alignment.write("\n\t\t\t<relation>=</relation>")
#         alignment.write("\n\t\t\t<revision>")
#         alignment.write("\n\t\t\t\t<status>"+mappings[j][1]+"</status>")
        
#         alignment.write("\n\t\t\t</revision>")
#         alignment.write("\n\t\t</Cell>")
#         alignment.write("\n\t</map>\n\n")

#     alignment.write("</Alignment>")
#     alignment.write("\n</rdf:RDF>")
#     alignment.close()


# def getIri (idd, attr):
#     """ 
#     Receives a list of the attributes of all classes and an id for a specific class and returns the corresponding iri.

#     Requires:attr is a list of dictionaries with attributes of each class, idd is a str.
#     Ensures: iri corresponding to the class with that id.
#     """
#     for i in attr:
#         if 'id' in i.keys():
#             if i['id']==idd:
#                 iri=i['iri']
#     return iri


def allocate(srcFileName, tgtFileName="", alignFileName=""):
    # if tgtFileName=="" and alignFileName=="":
    #     JSON2RDF(srcFileName[0])

    #else:
    merger(srcFileName, tgtFileName, alignFileName)

if len(sys.argv[1:]) ==1:
    inputFileName1= sys.argv[1:]
    allocate(inputFileName1)
else:
    inputFileName1, inputFileName2, inputFileName3 = sys.argv[1:]
    allocate(inputFileName1, inputFileName2,inputFileName3)

