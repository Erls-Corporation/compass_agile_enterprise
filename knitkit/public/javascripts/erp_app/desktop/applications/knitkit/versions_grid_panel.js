Ext.define("Compass.ErpApp.Desktop.Applications.Knitkit.VersionsGridPanel",{
  extend:"Ext.grid.Panel",
  initComponent: function() {
    this.callParent(arguments);
    this.getStore().load();
  },

  constructor : function(config) {
    var overiddenColumns = [
    {
      header:'Version',
      dataIndex:'version',
      sortable:true,
      width:50
    },
    {
      header:'Timestamp',
      dataIndex:'updated_at',
      sortable:true,
      renderer: Ext.util.Format.dateRenderer('m/d/Y H:i:s'),
      width:120
    },
    {
      header:'Published By',
      dataIndex: 'publisher'
    }];

    if(!Compass.ErpApp.Utility.isBlank(config['columns'])){
      overiddenColumns = overiddenColumns.concat(config['columns']);
    }

    overiddenColumns = overiddenColumns.concat([
    {
      menuDisabled:true,
      resizable:false,
      xtype:'actioncolumn',
      header:'View',
      align:'center',
      width:60,
      items:[{
        icon:'/images/icons/document_view/document_view_16x16.png',
        tooltip:'View',
        handler :function(grid, rowIndex, colIndex){
          var rec = grid.getStore().getAt(rowIndex);
          grid.ownerCt.viewVersionedContent(rec);
        }
      }]
    },
    {
      menuDisabled:true,
      resizable:false,
      xtype:'actioncolumn',
      header:'Revert',
      align:'center',
      width:60,
      items:[{
        icon:'/images/icons/document_down/document_down_16x16.png',
        tooltip:'Revert',
        handler :function(grid, rowIndex, colIndex){
          var rec = grid.getStore().getAt(rowIndex);
          grid.ownerCt.revert(rec);
        }
      }]
    },
    {
      menuDisabled:true,
      resizable:false,
      xtype:'actioncolumn',
      header:'Published',
      align:'center',
      width:60,
      items:[{
        getClass: function(v, meta, rec) {  // Or return a class from a function
          if (rec.get('published')) {
            this.items[0].tooltip = 'Published';
            return 'published-col';
          } else {
            this.items[0].tooltip = 'Publish';
            return 'publish-col';
          }
        },
        handler: function(grid, rowIndex, colIndex) {
           var rec = grid.getStore().getAt(rowIndex);
                    if(rec.get('published')){
                        return false;
                    }
                    else{
                        grid.ownerCt.publish(rec)
                    }

        }
      }]
    },
    {
      header:'Active',
      dataIndex:'active',
      sortable:true,
      align:'center',
      width:60,
      renderer:function(){
        var rec = arguments[2];
        if (rec.get('active')){
          return '<img class="x-action-col-0 active-col" ext:qtip="Active" src="data:image/gif;base64,R0lGODlhAQABAID/AMDAwAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="">'
        }
        else{
          return '<img class="x-action-col-0 activate-col" ext:qtip="Not Active" src="data:image/gif;base64,R0lGODlhAQABAID/AMDAwAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="">'
        }
      }
    }
    ]);

    config['columns'] = overiddenColumns;
    config = Ext.apply({
      bbar: Ext.create("Ext.PagingToolbar",{
        pageSize: 15,
        store: config['store'],
        displayInfo: true,
        displayMsg: '{0} - {1} of {2}',
        emptyMsg: "Empty"
      })
    }, config);

    this.callParent([config]);
  }
});

Ext.define("Compass.ErpApp.Desktop.Applications.Knitkit.VersionsArticleGridPanel",{
  extend:"Compass.ErpApp.Desktop.Applications.Knitkit.VersionsGridPanel",
  alias:'widget.knitkit_versionsarticlegridpanel',
  viewVersionedContent : function(rec){
    this.initialConfig['centerRegion'].viewContent(rec.get('title') + " - Revision " + rec.get('version'), rec.get('body_html'));
  },

      revert: function(rec){
        if (currentUser.hasApplicationCapability('knitkit', {
            capability_type_iid:'revert_version',
            resource:'Article'
        }))
        {
            var self = this;
            self.initialConfig['centerRegion'].setWindowStatus('Reverting...');
            var conn = new Ext.data.Connection();
            conn.request({
                url: '/knitkit/erp_app/desktop/versions/revert_content',
                method: 'POST',
                params:{
                    id:rec.get('id'),
                    version:rec.get('version')
                },
                success: function(response) {
	        self.initialConfig['centerRegion'].clearWindowStatus();
                    var obj =  Ext.decode(response.responseText);
                    if(obj.success){
                        self.initialConfig['centerRegion'].replaceHtmlInActiveCkEditor(rec.get('body_html'));
                        self.getStore().load();
                    }
                    else{
                        Ext.Msg.alert('Error', 'Error reverting');
                    }
                },
                failure: function(response) {
                    self.initialConfig['centerRegion'].clearWindowStatus();
                    Ext.Msg.alert('Error', 'Error reverting');
                }
            });
        } else {
            currentUser.showInvalidAccess();
        }
    },
    
    publish: function(rec){
        if (currentUser.hasApplicationCapability('knitkit', {
            capability_type_iid:'publish',
            resource:'Article'
        }))
        {
            var self = this;

            var publishWindow = new Compass.ErpApp.Desktop.Applications.Knitkit.PublishWindow({
                baseParams:{
                    id:rec.get('id'),
                    site_id:self.initialConfig.siteId,
                    version:rec.get('version')
                },
                url:'/knitkit/erp_app/desktop/versions/publish_content',
                listeners:{
                    'publish_success':function(window, response){
                        if(response.success){
                            self.initialConfig['centerRegion'].clearWindowStatus();
                            self.getStore().load();
                        }
                        else{
                            Ext.Msg.alert('Error', 'Error publishing');
                            self.initialConfig['centerRegion'].clearWindowStatus();
                        }
                    },
                    'publish_failure':function(window, response){
                        self.initialConfig['centerRegion'].clearWindowStatus();
                        Ext.Msg.alert('Error', 'Error publishing');
                    }
                }
            });

            publishWindow.show();
        } else {
            currentUser.showInvalidAccess();
        }
    },

  constructor : function(config) {
    config = Ext.apply({
      store:Ext.create("Ext.data.Store",{
        proxy: {
          type: 'ajax',
          url:'/knitkit/erp_app/desktop/versions/content_versions',
          reader: {
            type: 'json',
            root: 'data'
          },
          extraParams:{
            id:config['contentId'],
            site_id:config['siteId']
          }
        },
        idProperty: 'id',
        remoteSort: true,
        fields: [
        {
          name:'published'
        },
        {
          name:'id'
        },
        {
          name:'version'
        },
        {
          name:'title'
        },
        {
          name:'excerpt_html'
        },
        {
          name:'body_html'
        },
        {
          name:'active'
        },
        {
          name:'updated_at',
          type:'date'
        },
        {
          name:'publisher'
        }
        ]
      })
    }, config);

    this.callParent([config]);
  }
});

Ext.define("Compass.ErpApp.Desktop.Applications.Knitkit.VersionsBlogGridPanel",{
  extend:"Compass.ErpApp.Desktop.Applications.Knitkit.VersionsGridPanel",
  alias:'widget.knitkit_versionsbloggridpanel',

  viewVersionedContent : function(rec){
    this.initialConfig['centerRegion'].viewContent(rec.get('title') + " - Revision " + rec.get('version'), rec.get('body_html'));
  },

  revert: function(rec){
    var self = this;
    self.initialConfig['centerRegion'].setWindowStatus('Reverting...');
    Ext.Ajax.request({
      url: '/knitkit/erp_app/desktop/versions/revert_content',
      method: 'POST',
      params:{
        id:rec.get('id'),
        version:rec.get('version')
      },
      success: function(response) {
        self.initialConfig['centerRegion'].clearWindowStatus();
        var obj =  Ext.decode(response.responseText);
        if(obj.success){
          self.initialConfig['centerRegion'].replaceHtmlInActiveCkEditor(rec.get('body_html'));
          self.getStore().load();
        }
        else{
          Ext.Msg.alert('Error', 'Error reverting');
        }
      },
      failure: function(response) {
        self.initialConfig['centerRegion'].clearWindowStatus();
        Ext.Msg.alert('Error', 'Error reverting');
      }
    });
  },

  publish: function(rec){
    var self = this;

    var publishWindow = new Compass.ErpApp.Desktop.Applications.Knitkit.PublishWindow({
      baseParams:{
        id:rec.get('id'),
        site_id:self.initialConfig.siteId,
        version:rec.get('version')
      },
      url:'/knitkit/erp_app/desktop/versions/publish_content',
      listeners:{
        'publish_success':function(window, response){
          if(response.success){
            self.initialConfig['centerRegion'].clearWindowStatus();
            self.getStore().load();
          }
          else{
            Ext.Msg.alert('Error', 'Error publishing');
            self.initialConfig['centerRegion'].clearWindowStatus();
          }
        },
        'publish_failure':function(window, response){
          self.initialConfig['centerRegion'].clearWindowStatus();
          Ext.Msg.alert('Error', 'Error publishing');
        }
      }
    });

    publishWindow.show();
  },

  constructor : function(config) {
    config = Ext.apply({
      store:Ext.create("Ext.data.Store",{
        proxy: {
          type: 'ajax',
          url:'/knitkit/erp_app/desktop/versions/content_versions',
          reader: {
            type: 'json',
            root: 'data'
          },
          extraParams:{
            id:config['contentId'],
            site_id:config['siteId']
          }
        },
        idProperty: 'id',
        remoteSort: true,
        fields: [
        {
          name:'id'
        },
        {
          name:'version'
        },
        {
          name:'title'
        },
        {
          name:'excerpt_html'
        },
        {
          name:'body_html'
        },
        {
          name:'active'
        },
        {
          name:'updated_at',
          type:'date'
        },
        {
          name:'published'
        },
        {
          name:'publisher'
        }
        ]
      }),
      columns:[
      {
        menuDisabled:true,
        resizable:false,
        xtype:'actioncolumn',
        header:'Excerpt',
        align:'center',
        width:50,
        items:[{
          icon:'/images/icons/document_view/document_view_16x16.png',
          tooltip:'View',
          handler :function(grid, rowIndex, colIndex){
            var rec = grid.getStore().getAt(rowIndex);
            grid.initialConfig['centerRegion'].viewContent(rec.get('title') + " Excerpt - Revision " + rec.get('version'), rec.get('body_html'));
          }
        }]
      }]
    }, config);

    this.callParent([config]);
  }
});

Ext.define("Compass.ErpApp.Desktop.Applications.Knitkit.VersionsWebsiteSectionGridPanel",{
  extend:"Compass.ErpApp.Desktop.Applications.Knitkit.VersionsGridPanel",
  alias:'widget.knitkit_versionswebsitesectiongridpanel',

  viewVersionedContent : function(rec){
    this.initialConfig['centerRegion'].setWindowStatus('Loading template...');
    var self = this;
    Ext.Ajax.request({
      url: '/knitkit/erp_app/desktop/versions/get_website_section_version',
      method: 'POST',
      params:{
        id:rec.get('id'),
        version:rec.get('version')
      },
      success: function(response) {
        self.initialConfig['centerRegion'].clearWindowStatus();
        var template = response.responseText
        self.initialConfig['centerRegion'].viewSectionLayout(rec.get('title'),template);
      },
      failure: function(response) {
        self.initialConfig['centerRegion'].clearWindowStatus();
        Ext.Msg.alert('Error', 'Error loading tempalte');
      }
    });
  },

  revert: function(rec){
    var self = this;
    self.initialConfig['centerRegion'].setWindowStatus('Reverting...');
    Ext.Ajax.request({
      url: '/knitkit/erp_app/desktop/versions/revert_website_section',
      method: 'POST',
      params:{
        id:rec.get('id'),
        version:rec.get('version')
      },
      success: function(response) {
        self.initialConfig['centerRegion'].clearWindowStatus();
        var obj = Ext.decode(response.responseText);
        if(obj.success){
          self.initialConfig['centerRegion'].replaceContentInActiveCodeMirror(obj.body_html);
          self.getStore().load();
        }
        else{
          Ext.Msg.alert('Error', 'Error reverting');
        }
      },
      failure: function(response) {
        self.initialConfig['centerRegion'].clearWindowStatus();
        Ext.Msg.alert('Error', 'Error reverting');
      }
    });
  },

  publish: function(rec){
    var self = this;

    var publishWindow = new Compass.ErpApp.Desktop.Applications.Knitkit.PublishWindow({
      baseParams:{
        id:rec.get('id'),
        site_id:self.initialConfig.siteId,
        version:rec.get('version')
      },
      url:'/knitkit/erp_app/desktop/versions/publish_website_section',
      listeners:{
        'publish_success':function(window, response){
          if(response.success){
            self.initialConfig['centerRegion'].clearWindowStatus();
            self.getStore().load();
          }
          else{
            Ext.Msg.alert('Error', 'Error publishing');
            self.initialConfig['centerRegion'].clearWindowStatus();
          }
        },
        'publish_failure':function(window, response){
          self.initialConfig['centerRegion'].clearWindowStatus();
          Ext.Msg.alert('Error', 'Error publishing');
        }
      }
    });

    publishWindow.show();
  },

  constructor : function(config) {
    config = Ext.apply({
      store:Ext.create("Ext.data.Store",{
        proxy: {
          type: 'ajax',
          url:'/knitkit/erp_app/desktop/versions/website_section_layout_versions',
          reader: {
            type: 'json',
            root: 'data'
          },
          extraParams:{
            id:config['websiteSectionId'],
            site_id:config['siteId']
          }
        },
        idProperty: 'id',
        remoteSort: true,
        fields: [
        {
          name:'id'
        },
        {
          name:'version'
        },
        {
          name:'title'
        },
        {
          name:'updated_at',
          type:'date'
        },
        {
          name:'active'
        },
        {
          name:'published'
        },
        {
          name:'publisher'
        }
        ]
      })
    }, config);

    this.callParent([config]);
  }
});

Ext.define("Compass.ErpApp.Desktop.Applications.Knitkit.NonPublishedVersionsGridPanel",{
  extend:"Ext.grid.Panel",
  alias:'widget.knitkit_nonpublishedversionswebsitesectiongridpanel',
  viewVersionedContent : function(rec){
    this.initialConfig['centerRegion'].viewContent(rec.get('title') + " - Revision " + rec.get('version'), rec.get('body_html'));
  },

  revert: function(rec){
    var self = this;
    self.initialConfig['centerRegion'].setWindowStatus('Reverting...');
    Ext.Ajax.request({
      url: '/knitkit/erp_app/desktop/versions/revert_content',
      method: 'POST',
      params:{
        id:rec.get('id'),
        version:rec.get('version')
      },
      success: function(response) {
        self.initialConfig['centerRegion'].clearWindowStatus();
        var obj =  Ext.decode(response.responseText);
        if(obj.success){
          self.initialConfig['centerRegion'].replaceHtmlInActiveCkEditor(rec.get('body_html'));
          self.getStore().load();
        }
        else{
          Ext.Msg.alert('Error', 'Error reverting');
        }
      },
      failure: function(response) {
        self.initialConfig['centerRegion'].clearWindowStatus();
        Ext.Msg.alert('Error', 'Error reverting');
      }
    });
  },

  initComponent: function() {
    Compass.ErpApp.Desktop.Applications.Knitkit.NonPublishedVersionsGridPanel.superclass.initComponent.call(this, arguments);
    this.getStore().load();
  },

  constructor : function(config) {
    var store = Ext.create("Ext.data.Store",{
      proxy: {
        type: 'ajax',
        url:'/knitkit/erp_app/desktop/versions/non_published_content_versions',
        reader: {
          type: 'json',
          root: 'data'
        },
        extraParams:{
          id:config['contentId']
        }
      },
      idProperty: 'id',
      remoteSort: true,
      fields: [
      {
        name:'id'
      },
      {
        name:'version'
      },
      {
        name:'title'
      },
      {
        name:'excerpt_html'
      },
      {
        name:'body_html'
      },
      {
        name:'updated_at',
        type:'date'
      }
      ]
    });

    config = Ext.apply({
      columns:[ {
        header:'Version',
        dataIndex:'version',
        sortable:true,
        width:50
      },
      {
        header:'Timestamp',
        dataIndex:'updated_at',
        sortable:true,
        renderer: Ext.util.Format.dateRenderer('m/d/Y H:i:s'),
        width:120
      },{
        menuDisabled:true,
        resizable:false,
        xtype:'actioncolumn',
        header:'View',
        align:'center',
        width:60,
        items:[{
          icon:'/images/icons/document_view/document_view_16x16.png',
          tooltip:'View',
          handler :function(grid, rowIndex, colIndex){
            var rec = grid.getStore().getAt(rowIndex);
            grid.ownerCt.viewVersionedContent(rec);
          }
        }]
      },
      {
        menuDisabled:true,
        resizable:false,
        xtype:'actioncolumn',
        header:'Revert',
        align:'center',
        width:60,
        items:[{
          icon:'/images/icons/document_down/document_down_16x16.png',
          tooltip:'Revert',
          handler :function(grid, rowIndex, colIndex){
            var rec = grid.getStore().getAt(rowIndex);
            grid.ownerCt.revert(rec);
          }
        }]
      }],
      store:store,
      bbar: Ext.create("Ext.PagingToolbar",{
        pageSize: 15,
        store: store,
        displayInfo: true,
        displayMsg: '{0} - {1} of {2}',
        emptyMsg: "Empty"
      })
    }, config);

    Compass.ErpApp.Desktop.Applications.Knitkit.NonPublishedVersionsGridPanel.superclass.constructor.call(this, config);
  }
});

