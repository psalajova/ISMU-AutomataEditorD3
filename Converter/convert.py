# coding=utf-8

import os
import sys
import re
import glob

ISpath = "//is.muni.cz/auth/el/fi/jaro2021/IB005/odp/support/v2/"
noScript = "<noscript>(Nemáte zapnutý JavaScript, ale pro správnou funkci otázky je nutný JavaScript. Jako prohlížeč je doporučený Firefox.)</noscript>\n"

def getScript(src):
    return "<script src=\"" + src + "\"></script>\n"


def getStyle(path):
   return "<style>@import \"" + path + "\";</style>"


"""
Parses the type from line.
"""
def getType(line):
    result = ""
    if line.find('-') != -1:
        result = line[line.find('-') + 1: line.find('-') + 4]   
    else:
        return -1

    types = ["DFA", "EFA", "NFA", "GRA", "REG"]
    if (result == "MIN") or (result == "TOT") or (result == "MIC"):
        return "DFA"
    elif result in types:
        return result
    return -1


"""
Adds header to the file.
@param questions - converted questions
@param types - a set of types (e.g. "DFA", "EFA")
"""
def addHeader(questions, types):
    res = "++\n"
    res += "<script>\n"
    res += "var ISpath = \"" + ISpath + "\";\n"
    res += "var langDirPath = ISpath;\n"
    res += "if (typeof jQuery.ui == \"undefined\") {\n"
    res += "\tdocument.write(`\<script src=\\\"${ISpath}" + "jquery-ui.js\\\"><\/script>`);\n"
    res += "\tdocument.write(`\<style>@import \\\"${ISpath}jquery-ui.css\\\";<\/style>`);\n}"
    res += "\nif ($(`script[src=\\\"${ISpath}editor2.js\\\"]`).length === 0) {\n\t[\"editor2.js\", \"utilIS.js\", \"d3.v6.min.js\"].forEach(src => {"
    res += "\n\t\tdocument.write(`\<script src=\\\"${ISpath}" +"${src}\\\"><\/script>`);"
    res += "\n\t});"
    res += "\n\tdocument.write(`\<style>@import \\\"${ISpath}editorStyle.css\\\";<\/style>`);"
    res += "\n}"
    res += addParsers(types)
    res += "\n</script>\n"
    res += questions
    return res


"""
Appends parsers found in questions.
@param types - a set of types (e.g. "DFA", "EFA")
"""
def addParsers(types):
    if len(types) == 0:
        return "\n"
    res = "\n["
    for t in types:
        res += "\"" + t + "\","
    res = res[:-1]
    res += ']'

    res += ".forEach(type => {\n\tif ($(`script[src=\\\"${ISpath}${type}Parser.js\\\"]`).length === 0) {\n\t\tdocument.write(`\<script src=\\\"${ISpath}${type}Parser.js\\\"><\/script>`);}\n});"
    return res


"""
Removes v3 editor's code from file.
@param content - file content
"""
def stripOldEditor(content):
    questions = content.split("--")[1:-1] #remove the header and trailer, split into individual questions 
    result = []
    regE = ' :((e)|(e1a))_+ '

    for q in questions:
        for line in q.splitlines():
            if "<input name=" in line:
                match = re.search(regE, line)
                if match:
                    found = match.group(0)
                    result.append(found)
                else:
                    print("didnt find :e_____")
                    break

            elif "<ul class=\"nav nav-tabs\"" in line or "<div id=" in line:
                continue
            else:
                result.append(line)

        result.append("--")

    result.pop()
    content = '\n'.join(result)
    return content


"""
Appends my editor to clear questions.
@param content - questions from .qdef file
"""
def addMy(content):
    result = []
    types = set()
    _type = -1
    count = 0
    succCount = 0
    
    for q in content.split("\n--\n"):
        count += 1
        lines = q.splitlines()

        for line in lines:
            if ":e" in line and "=" in line:
                _type = getType(line)

        result.append("\n--\n")
        if _type != -1:
            result.append("<script>editor_init(\"" + _type +"\");</script>")
            types.add(_type)
            _type = -1

        result.append(q.lstrip().rstrip())
        succCount += 1

    print("Successfully converted {}/{} questions.\n".format(succCount, count))
    if (len(types) > 0):
        content = addHeader(''.join(result), types)

    return content


"""
@param filePath - file to convert
@param dirPath  - directory path where the new converted file will be saved
@param ext      - extension which will be added to the converted file's name
@param strip    - boolean, True if we want to strip old editor or False if the questions are already "clean"
"""
def convertOnefile(filePath, dirPath, ext, strip = True):
    print("Converting " + os.path.basename(filePath))
    with open(os.path.join(os.getcwd(), filePath), encoding="utf-8") as f:
        content = f.read()
        if strip:
            content = stripOldEditor(content)
        content = addMy(content)

        newName = os.path.basename(filePath)[:-5] + ext + ".qdef"
        with open(os.path.join(dirPath, newName), "w", encoding='utf-8') as wf:
            wf.write(content)


"""
@param path     - filepath
@param ext      - extension which will be added to the converted file's name
@param strip    - boolean, true if we want to strip old editor or false if the questions are "clean"
"""
def convert(dirPath, ext, strip):
    try:
        newDirPath = os.path.join(dirPath, "Converted")
        if not os.path.exists(newDirPath):
            os.mkdir(newDirPath)

        for filePath in glob.glob(os.path.join(dirPath, '*.qdef')):
            convertOnefile(filePath, newDirPath, ext, strip)         

    except Exception as e:
        print("Error happened while converting")
        print(e)


"""
Starter function that can take 4 command line arguments:
<path_to_script> <path_to_file/dir> <ext> -s

<ext> is optional, will be used as extension to the converted files' names
-s is an option used when we want to strip the previous editor from files
"""
def setup(args):
    strip = False
    ext = "_new"
    dirExt = ""
    
    if (len(args) < 2):
        print("Directory path not specified.")
        return
    if len(args) > 2 and args[2] != "-s":
        ext = dirExt = args[2]
    if "-s" in args:
        strip = True
    if os.path.isfile(args[1]):
        if args[1].lower().endswith('.qdef') == False:
            print("Unable to convert, the file needs to have .qdef extension.")
            return
        convertOnefile(args[1], "", ext, strip)
    elif os.path.isdir(args[1]):
        convert(args[1], dirExt, strip)
    else:
        print("Unable to convert, could not find {}.".format(args[1]))
    

setup(sys.argv)