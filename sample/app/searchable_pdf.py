class SearchablePDF():
 
    def __init__(self,
        pdf="",
        json_schema_string=""
    ):
        pass
        
    def query(self, query):
        return {
            'status': 'success',
            'answer': ["this is a message"],
            'focus_point': [123, 435], # in img coordinates
            'bboxes': [], # in img coordinates
            'direction': 270
        }