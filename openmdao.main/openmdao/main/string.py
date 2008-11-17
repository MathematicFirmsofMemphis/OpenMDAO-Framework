
#public symbols
__all__ = []
__version__ = "0.1"


from openmdao.main.interfaces import IVariable
from openmdao.main.exceptions import ConstraintError
from openmdao.main.variable import Variable
            
class String(Variable):
    """A string Variable"""
    
    def __init__(self, name, parent, iostatus, ref_name=None, 
                 default=None, desc=None, min_length=None, max_length=None):
        self.min_length = min_length
        self.max_length = max_length
        Variable.__init__(self, name, parent, iostatus, ref_name=ref_name, 
                          default=default, desc=desc)
            
    def _pre_assign(self, var, attrname=None):
        """Return the value of the specified Variable after
        checking against min and max length limits.
        """
        if attrname is not None:
            var = var.get(attrname)
            
        if IVariable.providedBy(var):
            newval = var.value
        else:
            newval = var
            
        if not isinstance(newval, basestring):
            raise ValueError(self.get_pathname()+': type incompatible with '+str(type(newval)))
        
        # check against min and max length limits
        if self.min_length is not None and len(newval) < self.min_length:
            raise ConstraintError(self.get_pathname()+
                                  ' min_length violated: '+
                                  str(len(newval))+' < '+
                                  str(self.min_length))
        if self.max_length is not None and len(newval) > self.max_length:
            raise ConstraintError(self.get_pathname()+
                                  ' max_length violated: '+
                                  str(len(newval))+' > '+
                                  str(self.max_length))
            
        return newval
        
        
    def _pre_connect(self, variable, attrname=None):
        """Raise a TypeError if the connecting Variable is incompatible."""
        self._pre_assign(variable, attrname)

