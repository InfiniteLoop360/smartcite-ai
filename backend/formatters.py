from citeproc import CitationStylesStyle, CitationStylesBibliography, formatter
from citeproc import Citation, CitationItem
from citeproc.source.json import CiteProcJSON
from citeproc_styles import get_style_filepath

def format_citation(data, style_name='apa'):
    # Create the source for CiteProc
    bib_source = CiteProcJSON([data])
    
    style_path = get_style_filepath(style_name)
    style = CitationStylesStyle(style_path, validate=False)
    
    bibliography = CitationStylesBibliography(style, bib_source, formatter.plain)
    
    citation = Citation([CitationItem(data['id'])])
    bibliography.register(citation)
    
    bib_entries = bibliography.bibliography()
    if bib_entries:
        # Combine fragments into a string
        raw_citation = "".join(map(str, bib_entries))
        
        # SAFETY NET: Remove any literal brackets that might have sneaked through
        clean_citation = raw_citation.replace("['", "").replace("']", "").replace('["', "").replace('"]', "")
        return clean_citation
    
    return "Citation could not be formatted."