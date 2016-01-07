/*jshint forin:false, eqnull:true*/
/* globals jQuery*/

(function(root,factory) {
    
    if (typeof define != "undefined" && define.amd) define("jsyg-menu",["jquery","jsyg-stdconstruct","jquery-hotkeys"],factory);
    else if (typeof jQuery != "undefined") {
        
        if (typeof JSYG!= "undefined" && typeof JSYG.StdConstruct != "undefined") factory(jQuery,StdConstruct);
        else if (typeof StdConstruct != "undefined") {
            if (root.JMenu !== undefined) throw new Error("conflict with JMenu variable");
            root.JMenu = factory(jQuery,StdConstruct);
        }
        else throw new Error("StdConstruct dependency is missing");
    }
    else throw new Error("jQuery is needed");
    
})(this,function($,StdConstruct) {
    
    "use strict";
        
    /**
     * Constructeur d'éléments de menu
     * @param arg optionnel, argument jQuery pointant vers l'élément DOM. Si non défini il sera créé (balise "a").
     * @param opt optionnel, objet définissant les options
     * @returns {MenuItem}
     * @see {Menu}
     */
     function MenuItem(arg,opt) {
        
        if ($.isPlainObject(arg)) { opt = arg; arg = null; }
        
        if (!arg) arg = '<a>';
        
        this.container = $(arg)[0];
        
        if (opt) this.set(opt);
    }
    
    MenuItem.prototype = {
        
        constructor : MenuItem, 
        
        set : function(opt) {
            
            var cible = this,
            submenu, n;
            
            if (!$.isPlainObject(opt)) return cible;
            
            for (n in opt) {
                
                if (n in cible) {
                    
                    if (n == 'submenu' && Array.isArray(opt.submenu)) {
                        
                        submenu = new Menu();
                        opt.submenu.forEach(function(item) { submenu.addItem(item); });
                        this.submenu = submenu;
                    }
                    else cible[n] = opt[n];
                }
            }
            
            return cible;
        },
        /**
         * url de l'icone
         */
        icon:null,
        /**
         * texte à afficher
         */
        text:null,
        /**
         * Identifiant de l'item, qui permettra de retrouver l'objet à partir de la méthode getItem de Menu
         */
        name : null,
        /**
         * pour désactiver l'élément 
         */
        disabled:false,
        /**
         * Fonction à exécuter lors du clic, ou "submenu" pour afficher ou sous-menu
         */
        action:null,
        /**
         * Objet sous-menu dans le cas où l'item permet juste l'affichage d'un sous-menu
         */
        submenu:null,
        /**
         * Maintient ou non l'affichage du menu à l'exécution de l'action
         */
        keepMenu:false,
        
        checkbox : false,
        checked : false,
        
        shortCut : null,
        
        globalShortCut : null,
        
        /**
         * Ajout de l'élément à un menu contextuel (instance de Menu)
         * @param contextmenu instance de Menu ou ContextItem (pour un sous-menu)
         * @param ind optionnel, indice de l'élément dans le menu
         * @returns {MenuItem}
         */
        addTo : function(menu,ind) {
            
            if (menu instanceof MenuItem) {
                
                if (menu.submenu == null) menu.submenu = new Menu();
                menu = menu.submenu;
            }
            
            menu.addItem(this,ind);
            
            return this;
        }
    };
    
    if (typeof JSYG != "undefined") JSYG.MenuItem = MenuItem;
    
    /**
     * Constructeur de menus
     * @param {Object} opt optionnel, objet définissant les options. Si défini, le menu est activé implicitement.
     * @returns {Menu}
     */
    function Menu(arg,opt) {
        
        if ($.isPlainObject(arg) || Array.isArray(arg)) { opt = arg; arg = null; }
        
        /**
         * Conteneur du menu contextuel
         */
        if (!arg) arg = document.createElement('ul');
        
        if (arg) this.node = $(arg)[0];
        /**
         * Tableau d'objets MenuItem définissant la liste des éléments du menu
         */
        this.list = [];
        /**
         * Liste des séparateurs d'éléments
         */
        this.dividers = [];
        
        this.keyboardCtrls = new KeyboardCtrls(this);
        
        if (opt) this.set(opt); 
    };
    
    Menu.prototype = new StdConstruct();
    
    Menu.prototype.constructor = Menu;
    
    Menu.prototype.set = function(opt,_cible) {
        
        var cible = _cible || this,
        that = this;
        
        if (Array.isArray(opt)) {
            this.clear();
            opt.forEach(function(item) { that.addItem(item); });
            return cible;
        }
        
        if (!$.isPlainObject(opt)) return cible;
        
        for (var n in opt) {
            
            if (n in cible) {
                if (($.isPlainObject(opt[n])) && cible[n] || n == 'list' && Array.isArray(opt[n])) this.set(opt[n],cible[n]);
                else cible[n] = opt[n];
            }
        }
        
        return cible;
    };
    /**
     * Classe appliquée au conteneur
     */
    Menu.prototype.className = 'jsyg-menu';
    /**
     * Classe à appliquer aux éléments du menu désactivés
     */
    Menu.prototype.classDisabled = "disabled";
    /**
     * Classe à appliquer aux sous-menus
     */
    Menu.prototype.classSubmenu = "submenu";
    /**
     * Classe à appliquer aux span précisant le raccourci global
     */
    Menu.prototype.classGlobalShortCut = "globalShortcut";
    /**
     * Classe à appliquer aux span précisant le raccourci
     */
    Menu.prototype.classShortCut = "shortCut";
    /**
     * Classe à appliquer aux span précisant le label
     */
    Menu.prototype.classLabel = "menuLabel";
    /**
     * Classe à appliquer aux éléments affichant un sous-menu
     */
    Menu.prototype.classDivider = "divider";
    
    Menu.prototype._currentItem = -1;
    Menu.prototype._timeout = null;
    
    Menu.prototype.parent = 'body';
    
    
    Menu.prototype.submenuDelay = 500;
    
    Menu.prototype.title = null;
    
    Menu.prototype.name = null;
    
    Menu.prototype.toolbar = null;
    /**
     * Indique si le menu est affiché ou non
     */
    Menu.prototype.display = false;
    /**
     * Fonctions à exécuter à l'affichage du menu
     */
    Menu.prototype.onshow = null;
    /**
     * Fonctions à exécuter quand on masque le menu
     */
    Menu.prototype.onhide = null;
    /**
     * Fonctions à exécuter à chaque fois que l'action d'un élément du menu est déclenchée.
     */
    Menu.prototype.onaction = null;
    /**
     * Indique si le menu est actif ou non
     */	
    Menu.prototype.enabled = false;
    
    Menu.prototype.enableShortCut = function(item) {
        
        var that = this;
        
        this.disableShortCut(item);
    
        function action(e) {
            that.triggerItem(item,e);
            if (!this.keepMenu) that.hide();
        };
        
        item._shortCutAction = action.bind(item);
    
        $(document).on("keydown",null,keys,item._shortCutAction);
        
        return this;
    };
    
    Menu.prototype.disableShortCut = function(item) {
      
        if (item._shortCutAction) $(document).off("keydown",item._shortCutAction);
    };
    
    Menu.prototype.createItem = function(arg,opt) {
        
        return new MenuItem(arg,opt);
    }
    /**
     * Ajout d'un élément au menu
     * @param item instance de MenuItem ou plainObject avec les options nécessaires
     * @param ind optionnel, indice de l'élément dans la liste
     * @returns {Menu}
     */
    Menu.prototype.addItem = function(item,ind) {
        
        if (ind == null) ind = this.list.length;
        
        if ($.isPlainObject(item)) item = new MenuItem(item);		
        
        if (item instanceof MenuItem) {
            
            if (this.list.indexOf(item) === -1) {
                
                this.list.splice(ind,0,item);
                
                if (item.globalShortCut) this.enableShortCut(item);
            }
            else throw new Error("L'item existe déjà");
        }
        else throw new Error(item + " n'est pas une instance de MenuItem");
        
        return this;
    };
    
    Menu.prototype.addDivider = function(ind) {
	
        if (ind == null) ind = this.list.length;
        if (this.dividers.indexOf(ind) === -1) this.dividers.push(ind);
        return this;
    };
    
    /**
     * Suppression d'un élément du menu
     * @param {Number,String,Object} item élément ou indice ou nom ou texte de l'élément à supprimer
     * @returns {Menu}
     */
    Menu.prototype.removeItem = function(item) {
        
        item = this.getItem(item);
        
        if (!item) throw new Error(item+' : indice ou element incorrect');
        
        var i = this.list.indexOf(item);
        
        if (item._globalShortCut) this.disableShortCut(item);
        this.list.splice(i,1);
        
        return this;
    };
    /**
     * Récupération d'un élément du menu
     * @param {Number,String,Object} item élément ou indice ou nom ou texte de l'élément à supprimer
     * @param {Boolean} recursive si true recherche dans les sous-menus
     * @returns {MenuItem}
     */
    Menu.prototype.getItem = function(item,recursive) {
        
        var menu,menuItem,i,N;
        
        if (recursive) {
            
            menuItem = this.getItem(item);
            
            if (!menuItem) {
                
                for (i=0,N=this.list.length;i<N;i++) {
                    
                    menu = this.list[i];
                    
                    if (menu.submenu) {
                        menuItem = menu.submenu.getItem(item,true);
                        break;
                    }
                }
            }
            
            return menuItem;
        }
        
        if (item instanceof MenuItem && this.list.indexOf(item) != -1) return item;
        else if ($.isNumeric(item) && this.list[item]) return this.list[item];
        else if (item && typeof item == 'string') {
            
            i = this.list.length;
            
            while (i--) {
                if (this.list[i].name == item || this.list[i].name == null && this.list[i].text == item) return this.list[i];
            }
        }
        
        return null;
    };
    /**
     * Réinitialisation du menu
     * @returns {Menu}
     */
    Menu.prototype.clear = function() {
	
        this.hide();
        this._clear();
        while (this.list.length) this.removeItem(0);
        this.dividers.splice(0,this.dividers.length);
        return this;
    };
    
    Menu.prototype.current = function() {
        return this.list[ this._currentItem ] || null;
    };
    
    Menu.prototype.triggerItem = function(item,e) {
	
        item = this.getItem(item);
        
        if (typeof item.action != 'function') return this;
        
        if (item.keepMenu) e.stopPropagation();
        
        var val,node,menu,
        input = $(item.container).find('input');
        
        if (input) {
            val = !input.val();
            input.val(val);
        }
        
        node = this.node,
        menu = this;
        
        //on récupère l'élément
        while (!node && menu) {
            menu = menu.parentMenu;
            node = menu && menu.node;
        }
        
        item.action.call(node,e,val);
        
        //s'il s'agit d'un sous-menu, il faut propager l'événement jusqu'au menu racine.
        menu = this;
        
        while (menu) { 
            menu.trigger('action',node,e,item);
            menu = menu.parentMenu;
        }
        
        if (!item.keepMenu) this.hideAll();
        
        return this;
    };
    
    Menu.prototype.focusItem = function(item) {
	
        item = this.getItem(item);
        $(item.container).trigger('focus');
        this._currentItem = this.list.indexOf(item);
        return this;
    };
    
    Menu.prototype.blur = function() {
	
        var current;
        if (current = this.current()) { $(current.container).trigger('blur'); }
        this._currentItem = -1;
        return this;
    };
    
    Menu.prototype.hideSubmenus = function() {
        this.list.forEach(function(item){ item.submenu && item.submenu.hide(); });
        return this;
    };
    
    Menu.prototype.showSubmenu = function(item,delay) {
        
        item = this.getItem(item);
        
        var jNode = $(item.container).parent();
    
        item.submenu.parent = jNode[0];
        
        $(item.submenu).css('visibility','hidden');
        
        item.submenu.show(delay,function(ul) {
            
            var sub = $(ul),
            $win = $(window),
            posLi = jNode.position(),
            offsetLi = jNode.offset(),
            widthSub = sub.outerWidth(),
            heightSub = sub.outerHeight(),
            x = posLi.left + jNode.outerWidth(),
            y = posLi.top;
                        
            if (offsetLi.left + jNode.outerWidth() + widthSub > $win.innerWidth()) x = posLi.left - widthSub;
            
            if (offsetLi.top + heightSub > $win.innerHeight()) y = posLi.top + jNode.height() - heightSub;
                        
            sub.css({left:x,top:y}).css('visibility','visible');
        });
        
        return this;
    };
    
    
    var keys =  ['Enter','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Escape'];
    
    Menu.prototype._keyboardAction = function(e) {
                
        var shortcuts = [],current,that = this;
        
        this.list.forEach(function(item) {
            if (item.shortCut) {
                shortcuts.push(item.shortCut);
            }
        });
        
        if (!this.display || (keys.indexOf(e.key) == -1 && shortcuts.indexOf(e.key) == -1) ) return;
        
        e.preventDefault();
        
        switch (e.key) {
            
            case 'Enter' :
                if (current = this.current()) {
                    if (current.submenu) { this.showSubmenu(current); current.submenu.focusItem(0);}
                    else {
                        this.triggerItem(current,e);
                        if (current.keepMenu) { this.focusItem(current); }
                    }
                }
                break;
            
            case 'ArrowUp' :
                if (this._currentItem <= 0) { this._currentItem = this.list.length; }
                this.focusItem(--this._currentItem);
                break;
            
            case 'ArrowDown' :
                if (this._currentItem >= this.list.length-1) { this._currentItem = -1; }
                this.focusItem(++this._currentItem);
                break;
            
            case 'ArrowLeft' :
                if (this.parentMenu) { this.hide(); }
                break;
            
            case 'ArrowRight' :
                if (current = this.current()) {
                    if (current.submenu) { this.showSubmenu(current); current.submenu.focusItem(0); }
                }
                break;
            
            case 'Escape' :
                this.hide();
                break;
            
            default :
                this.list.forEach(function(item) {
                    if (item.shortCut && item.shortCut.toLowerCase() == e.key) { that.triggerItem(item,e); return false; }
                });
                break;
        }
    };
    
    function KeyboardCtrls(menu) {
        
        this.menu = menu;
    }
    
    KeyboardCtrls.prototype = {
        
        enabled : false,
	
        enable : function() {
            
            this.disable();
            
            var keydown = this.menu._keyboardAction.bind(this.menu);
            
            $(document).on('keydown',keydown);
            
            this.disable = function() {
                $(document).off('keydown',keydown);
                this.enabled = false;
                return this;
            };
            
            this.enabled = true;
            
            return this;
        },
        
        disable : function() { return this; }
    };
    
    function isChildOf(node,parentTest) {
        
        var parent = node.parentNode;
        
        while (parent) {
            if (parent === parentTest) return true;
            parent = parent.parentNode;
        }
        
        return false;
    }
    
        
    Menu.prototype.create = function() {
	
        var that = this;
        
        this._clear();
        
        var jCont = $(this.node)
            .addClass(this.className)
            .on({
                contextmenu : function(e) { e.preventDefault(); },
                mousedown : function(e) { e.stopPropagation(); },
                mouseout : function(e) {
                    if (isChildOf(e.target,this)) return;
                    that.blur();
                }
            });
        
        this.list.forEach(function(item,ind) {
            
            if (that.dividers.indexOf(ind) !== -1) {
                jCont.append( $('<li>').addClass(that.classDivider) );
            }
            
            var li = $('<li>').appendTo(jCont),
            jA = $(item.container).attr("href","#").appendTo(li),
            input;
                        
            jA.on("click",function(e) { e.preventDefault(); });
            
            if (item.icon) jA.css('background-image','url('+item.icon+')');
            
            if (item.text) {
                                
                if (item.shortCut && (typeof item.action === 'function')) {
                    
                    var html = item.text
                        .replace(/\s/g,'&nbsp;')
                        .replace( new RegExp(item.shortCut,'i') , function(sub) { return '<span>'+sub+'</span>'; } );
                    
                    jA.html(html);
                    jA.find('span').addClass(that.classShortCut);
                }
                else {
                    $('<span>').addClass(that.classLabel).text(item.text).appendTo(jA);
                }
            }
           
            if (item.checkbox) {
                
                input = $('<input>')
                    .attr({type:"checkbox",name:'test'})
                    .prependTo(jA);
                
                if (item.checked) input.attr("checked","checked");
            }
            
            if (item.globalShortCut && (typeof item.action === 'function')) {
                
                $('<span>')
                    .addClass(that.classGlobalShortCut)
                    .text(item.globalShortCut)
                    .appendTo(jA);
            }
            
            
            if (item.disabled) {
                
                jA.addClass(that.classDisabled);
                jA.on({
                    mouseover : function() {
                        that.focusItem(item);
                        that.hideSubmenus();
                    }
                });
                
                if (item.checkbox) input.attr("disable","disable"); 
            }
            else if (item.submenu) {
                
                item.submenu.parentMenu = that;
                
                $(item.submenu.container).addClass(that.classSubmenu);
                
                $('<span>').addClass('submenuArrow').text('\u25B6').prependTo(jA);
                
                jA.on({
                    mouseover:function(e) {
                        if (that._currentItem == ind) return;
                        that.focusItem(item);
                        that.hideSubmenus();
                        that.showSubmenu(item,that.submenuDelay);
                    },
                    click : function() { that.showSubmenu(item); }
                });
                
                item.submenu.create();
            }
            else if (typeof item.action === 'function') {
                                
                if (item.checkbox) {
                    
                    input.on('mousedown',function(e) {
                        e.preventDefault();
                        that.triggerItem(item,e);
                        if (!item.keepMenu) that.hide();
                    });
                }
                
                jA.on({
                    click:function(e) {
                        that.triggerItem(item,e);
                        if (!item.keepMenu) that.hide();
                    },
                    mouseover:function() {
                        that.focusItem(item);
                        that.hideSubmenus();
                    }
                });
            }
            
        });
        
        return this;
    };
    
    Menu.prototype._clear = function() {
        
        var classDisabled = this.classDisabled;
        this.list.forEach(function(elmt) { $(elmt.container).removeClass(classDisabled).empty().remove(); });
        $(this.node).empty();
        this.keyboardCtrls.disable();
    };
    
    Menu.prototype.show = function(delay,callback) {
        
        if (this.display) this.hide(true);
        
        var that = this;
        
        if (delay) {
            this._timeout = window.setTimeout( function() { that.show(null,callback); } , delay );
            return this;
        }
        
        this.hide();
        
        $(this.node).appendTo(this.parent);
        
        this.parentMenu && this.parentMenu.keyboardCtrls.disable();
        
        this.keyboardCtrls.enable();
        
        this.display = true;
        
        callback && callback(this.node);
        
        this.trigger('show');
        
        return this;
    };
    
    Menu.prototype.update = function() {
        
        this._clear();
        this.create();
        
        return this;
    };
    
    /**
     * Masque le menu
     * @param preventEvent en interne surtout, booléen permettant de ne pas déclencher l'événement hide
     * @returns {Menu}
     */
    Menu.prototype.hide = function(preventEvent) {
        
        var parent,current;
	
        this.hideSubmenus();
        
        this._timeout && window.clearTimeout(this._timeout);
        this._timeout = null;
        
        this.keyboardCtrls.disable();
        
        $(this.node).detach();
        
        this.keyboardCtrls.disable();
        
        if (this.parentMenu) {
            parent = this.parentMenu;
            current = parent.current();
            current && parent.focusItem(current);
            parent.keyboardCtrls.enable();
        }
        
        this._currentItem = -1;
        
        this.display = false;
        
        if (!preventEvent) this.trigger('hide');
        
        return this;
    };
    
    Menu.prototype.toggle = function() {
        var args = $.makeArray(arguments);
        this.display && this.hide() || this.show.apply(this,args);
    };
    
    Menu.prototype.hideAll = function() {
        
        var parent = this;
        
        var rootMenu = this;
        
        while (parent = parent.parentMenu) rootMenu = parent;
        
        rootMenu.hide();
    };
    
    if (typeof JSYG != "undefined") JSYG.Menu = Menu;
        
    return Menu;
    
});