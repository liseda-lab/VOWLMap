# VOWLMap
We present VOWLMap, an extension of WebVOWL framework for validation of ontology alignments. The main goal of this project is to improve user interaction for validation of ontology alignments, by providing an interactive visualization of an alignment between 2 ontologies and interaction techniques that allow the user to explore and validate this alignment.

# Data

The JSON files in the data folder contain alingments between ontologies from Anatomy and Conference tracks of OAEI 2020.

# Source Code

The source folder contains the source code of VOWLMap.

# Running VOWLMap

To run VOWLMap on your machine, download and unpack ZIP folder. After that, in the extracted VOWLMap folder, open the HTML file to execute VOWLMap.

To create a JSON file of the alignment, execute the python file Converter. This file recieves as an input the two ontologies JSON files and an alignment RDF file.
Note that the conversion of ontologies into the VOWL-JSON format is not part of VOWLMap but requires an additional converter such as OWL2VOWL. 

# Authors

Ana Guerreiro  
Cátia Pesquita  
Daniel Faria
