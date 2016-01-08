# JSYG.Menu
Menu plugin originally designed for [JSYG framework](https://github.com/YannickBochatay/JSYG), but it works as well as a jQuery plugin.
Fits well with Bootstrap.

[demo](http://yannickbochatay.github.io/JSYG.Menu/)

```javascript
$('#ulElement')jMenu([{
    text:"element 1",
    shortCut:"t",
    icon:"fa fa-modx",
    submenu:[{
            text:"sub-element 1",
            action : function() {
                alert("click on sub-element 1");
            },
            disabled:true,
        },{
            text:"sub-element 2",
            submenu:[{
                    text:"sub-sub-element 1",
                    checkbox:true,
                    action:function(e,val) {
                        alert("checkbox is "+ (val ? '' : 'un') + "checked")
                    }
                },{
                    text:"sub-sub-element 2",
                    action : function() {
                        alert("click on sub-sub-element 2");
                    }
                }]
        }]
},{
    text:"element 2",
    icon:"fa fa-bug",
    action : function() {
        alert("tata");
    },
    globalShortCut:"ctrl+d"
},{
    text:"element 3",
    icon:"fa fa-book",
    submenu:[
        {
            text:"sub-element 1",
            action : function() {
                alert("click on sub-element 1");
            }
        },{
            text:"sub-element 2",
            action : function() {
                alert("click on sub-element 1");
            }
        }
    ]
},{
    text:"checkbox element",
    checkbox:true,
    checked:true,
    action:function(e,val) {
        alert("checkbox is "+ (val ? '' : 'un') + "checked")
    }
}]);
```
