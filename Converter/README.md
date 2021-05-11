# Converter

Python3 script for inserting the editor into IS MUNI .qdef files (question sets).

convert.py can be executed from command line:
```
python3 convert.py <file/folder> <name_ext> -s
```

- the second argument can be either a path to a .qdef file, or a folder containing .qdef files to convert.
- name_ext  - optional, will be appended to converted files' names (e.g. "_new": a0.qdef -> a0_new.qdef)
- -s        - optional, use to remove the previous editor from files