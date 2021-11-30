API.Plugins.events = {
	init:function(){
		API.GUI.Sidebar.Nav.add('events', 'main_navigation');
	},
	load:{
		index:function(){
			API.Builder.card($('#pagecontent'),{ title: 'Events', icon: 'events'}, function(card){
				API.request('events','read',{
					data:{options:{ link_to:'EventsIndex',plugin:'events',view:'index' }},
				},function(result) {
					var dataset = JSON.parse(result);
					if(dataset.success != undefined){
						for(var [key, value] of Object.entries(dataset.output.dom)){ API.Helper.set(API.Contents,['data','dom','events',value.id],value); }
						for(var [key, value] of Object.entries(dataset.output.raw)){ API.Helper.set(API.Contents,['data','raw','events',value.id],value); }
						API.Builder.table(card.children('.card-body'), dataset.output.dom, {
							headers:['id','name','type','date','time','address','city','zipcode','state','country'],
							id:'EventsIndex',
							modal:true,
							key:'id',
							clickable:{ enable:true, view:'details'},
							set:{isActive:"true"},
							controls:{ toolbar:true},
							import:{ key:'id', },
							load:false,
						});
					}
				});
			});
		},
		details:function(){
			var container = $('div[data-plugin="events"][data-id]').last();
			var url = new URL(window.location.href);
			var id = url.searchParams.get("id");
			API.request(url.searchParams.get("p"),'get',{data:{id:id,key:'id'}},function(result){
				var dataset = JSON.parse(result);
				if(dataset.success != undefined){
					container.attr('data-id',dataset.output.this.raw.id);
					// GUI
					// Adding Layout
					API.GUI.Layouts.details.build(dataset.output,container,{title:"Event Details",image:"/dist/img/building.png"},function(data,layout){
						if(layout.main.parents().eq(2).parent('.modal-body').length > 0){
							var modal = layout.main.parents().eq(2).parent('.modal-body').parents().eq(2);
							if(API.Auth.validate('plugin', 'events', 3)){
								modal.find('.modal-header').find('.btn-group').find('[data-control="update"]').off().click(function(){
									API.CRUD.update.show({ container:layout.main.parents().eq(2), keys:data.this.raw });
								});
							} else {
								modal.find('.modal-header').find('.btn-group').find('[data-control="update"]').remove();
							}
						}
						// History
						API.GUI.Layouts.details.tab(data,layout,{icon:"fas fa-history",text:API.Contents.Language["History"]},function(data,layout,tab,content){
							API.Helper.set(API.Contents,['layouts','events',data.this.raw.id,layout.main.attr('id')],layout);
							content.addClass('p-3');
							content.append('<div class="timeline" data-plugin="events"></div>');
							layout.timeline = content.find('div.timeline');
							var today = new Date();
							API.Builder.Timeline.add.date(layout.timeline,today);
							layout.timeline.find('.time-label').first().html('<div class="btn-group"></div>');
							layout.timeline.find('.time-label').first().find('div.btn-group').append('<button class="btn btn-primary" data-table="all">'+API.Contents.Language['All']+'</button>');
							var options = {plugin:"events"}
							// Debug
							if(API.debug){
								API.GUI.Layouts.details.button(data,layout,{icon:"fas fa-stethoscope"},function(data,layout,button){
									button.off().click(function(){
										console.log(data);
										console.log(layout);
									});
								});
							}
							// Clear
							if(API.Auth.validate('custom', 'events_clear', 1)){
								API.GUI.Layouts.details.control(data,layout,{color:"danger",icon:"fas fa-snowplow",text:API.Contents.Language["Clear"]},function(data,layout,button){
									button.off().click(function(){
										API.request('events','clear',{ data:data.this.raw },function(){
											API.Plugins.events.load.details();
										});
									});
								});
							}
							// Name
							options.field = "name";
							if(API.Helper.isSet(options,['td'])){ delete options.td; }
							API.GUI.Layouts.details.data(data,layout,options);
							// Address
							options.field = "address";
							options.td = '<td data-plugin="events">';
								options.td += '<span data-plugin="events" data-key="address">'+data.this.dom.address+'</span>, ';
								options.td += '<span data-plugin="events" data-key="city">'+data.this.dom.city+'</span>, ';
								options.td += '<span data-plugin="events" data-key="zipcode">'+data.this.dom.zipcode+'</span>';
							options.td += '</td>';
							API.GUI.Layouts.details.data(data,layout,options,function(data,layout,tr){});
							// Notes
							if(API.Helper.isSet(API.Plugins,['notes']) && API.Auth.validate('custom', 'events_notes', 1)){
								API.GUI.Layouts.details.tab(data,layout,{icon:"fas fa-sticky-note",text:API.Contents.Language["Notes"]},function(data,layout,tab,content){
									layout.timeline.find('.time-label').first().find('div.btn-group').append('<button class="btn btn-secondary" data-table="notes">'+API.Contents.Language['Notes']+'</button>');
									layout.content.notes = content;
									layout.tabs.notes = tab;
									if(API.Auth.validate('custom', 'events_notes', 2)){
										content.append('<div><textarea title="Note" name="note" class="form-control"></textarea></div>');
										content.find('textarea').summernote({
											toolbar: [
												['font', ['fontname', 'fontsize']],
												['style', ['bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript', 'clear']],
												['color', ['color']],
												['paragraph', ['style', 'ul', 'ol', 'paragraph', 'height']],
											],
											height: 250,
										});
										var html = '';
										html += '<nav class="navbar navbar-expand-lg navbar-dark bg-dark">';
											html += '<form class="form-inline my-2 my-lg-0 ml-auto">';
												html += '<button class="btn btn-warning my-2 my-sm-0" type="button" data-action="reply"><i class="fas fa-sticky-note mr-1"></i>'+API.Contents.Language['Add Note']+'</button>';
											html += '</form>';
										html += '</nav>';
										content.append(html);
									}
								});
								API.Plugins.events.Events.notes(data,layout);
							}
							// Continue
						});
					});
				}
			});
		},
		page:function(){
			$('div.wrapper').hide();
			var url = new URL(window.location.href);
			var id = url.searchParams.get("id");
			API.request(url.searchParams.get("p"),'get',{data:{id:id,key:'id'}},function(result){
				var dataset = JSON.parse(result);
				if(dataset.success != undefined){
					var data = dataset.output;
					var hosts = {};
					for(var [key, host] of Object.entries(API.Helper.trim(data.this.raw.setHosts,';').split(';'))){
						if(API.Helper.isSet(data,['relations',data.this.raw.setHostType,host])){
							API.Helper.set(hosts,[host],data.relations[data.this.raw.setHostType][host]);
						}
					}
					var items = {};
					if(API.Helper.isSet(data,['relations','event_items'])){
						for(var [key, item] of Object.entries(data.relations.event_items)){
							items[item.date+'T'+item.time] = item;
						}
						items = Object.keys(items).sort().reduce(
						  (obj, key) => { obj[key] = items[key];return obj; },{}
						);
					}
					console.log(data,hosts,items);
					var html = '';
					var count = 0;
					$('div.events-content-wrapper').remove();
					html += '<div class="events-content-wrapper events-background row m-0 align-items-center text-center justify-content-center">';
						if(API.Helper.isSet(hosts,[API.Contents.Auth.User.id])){
							html += '<button class="btn btn-warning btn-flat btn-ControlPanel" data-action="ControlPanel"><i class="fas fa-bars"></i></button>';
						}
					  html += '<div class="w-auto events-box bg-black noselect" id="events-1">';
					    html += '<p><h2>Bienvenue au mariage de</h2></p>';
							for(var [id, host] of Object.entries(hosts)){
								if(count > 0){ html += '<p><h1>&</h1></p>'; }
								html += '<p><h1 class="mt-3">'+host.name+'</h1></p>';
								count++;
							}
					    html += '<p class="mt-4"><button class="btn btn-warning btn-lg mt-4">Entrer</button></p>';
					  html += '</div>';
					  html += '<div class="events-box pt-0 bg-black noselect hide" id="events-2">';
							html += '<nav class="navbar navbar-expand-lg navbar-dark bg-transparent">';
							  html += '<button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarevents" aria-controls="navbarevents" aria-expanded="false" aria-label="Toggle navigation">';
							    html += '<i class="fas fa-bars"></i>';
							  html += '</button>';
							  html += '<div class="collapse navbar-collapse justify-content-center" id="navbarevents">';
							    html += '<div class="navbar-nav">';
							      html += '<a class="nav-item nav-link active" data-page="about">A Propos</a>';
							      html += '<a class="nav-item nav-link" data-page="gallery">Gallerie</a>';
							      html += '<a class="nav-item nav-link" data-page="attendance">Invitations</a>';
							      html += '<a class="nav-item nav-link" data-page="vows">Voeux</a>';
							      html += '<a class="nav-item nav-link" data-page="planning">Programme</a>';
							      html += '<a class="nav-item nav-link" data-page="menu">Menu</a>';
							    html += '</div>';
							  html += '</div>';
							html += '</nav>';
							html += '<div class="events-pages">';
								html += '<div class="events-page active" data-page="about">';
									html += '<p><h2>A Propos</h2></p>';
									html += data.this.raw.about;
								html += '</div>';
								html += '<div class="events-page hide" data-page="gallery">';
									html += '<p><h2>Gallerie</h2></p>';
									html += '<div class="row justify-content-center">';
										if(API.Helper.isSet(data,['relations','galleries']) && Object.keys(data.relations.galleries).length > 0){
											for(var [key, picture] of Object.entries(data.relations.galleries[Object.keys(data.relations.galleries)[0]].pictures)){
												html += '<div class="col-lg-4 col-sm-6 mb-4">';
													html += '<div class="portfolio-item">';
														html += '<a class="portfolio-link" data-toggle="modal" href="#portfolioModal'+key+'">';
															html += '<div class="portfolio-hover">';
																html += '<div class="portfolio-hover-content"><i class="fas fa-expand fa-3x"></i></div>';
															html += '</div>';
															html += '<img class="img-fluid" src="'+picture.dirname+'/'+picture.basename+'" alt="'+picture.basename+'" />';
														html += '</a>';
													html += '</div>';
												html += '</div>';
												html += '<div class="portfolio-modal modal fade" id="portfolioModal'+key+'" tabindex="-1" role="dialog" aria-hidden="true">';
							            html += '<div class="modal-dialog">';
						                html += '<div class="modal-content">';
				                      html += '<div class="row justify-content-center">';
				                        html += '<div class="col-12">';
				                          html += '<div class="modal-body">';
																		html += '<div class="button-modal download-modal" data-file="'+picture.dirname+'/'+picture.basename+'" data-basename="'+picture.basename+'"><i class="fas fa-angle-down fa-2x mt-2"></i></div>';
																		html += '<div class="button-modal close-modal" data-dismiss="modal"><i class="fas fa-times fa-2x mt-2"></i></div>';
				                            html += '<img class="img-fluid d-block mx-auto" src="'+picture.dirname+'/'+picture.basename+'" alt="'+picture.basename+'" />';
				                          html += '</div>';
				                        html += '</div>';
				                      html += '</div>';
						                html += '</div>';
							            html += '</div>';
								        html += '</div>';
											}
										}
										if(API.Helper.isSet(hosts,[API.Contents.Auth.User.id])){
											html += '<div class="col-12">';
												html += '<button class="btn btn-warning btn-lg btn-block" data-action="Upload"><i class="fas fa-plus"></i></button>';
											html += '</div>';
										}
									html += '</div>';
								html += '</div>';
								html += '<div class="events-page hide" data-page="attendance">';
									html += '<p><h2>Invitations</h2></p>';
									html += '<p class="text-justify">Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.</p>';
									html += '<p class="text-justify">The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by H. Rackham.</p>';
								html += '</div>';
								html += '<div class="events-page hide" data-page="vows">';
									html += '<p><h2>Voeux</h2></p>';
									html += '<p class="text-justify">Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.</p>';
									html += '<p class="text-justify">The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by H. Rackham.</p>';
								html += '</div>';
								html += '<div class="events-page hide" data-page="planning">';
									html += '<p><h2>Programme</h2></p>';
		              html += '<ul class="timeline">';
										var inverted = ' class="timeline-inverted"';
										for(var [stamp, item] of Object.entries(items)){
											if(inverted == ''){ inverted = ' class="timeline-inverted"'; } else { inverted = ''; }
											html += '<li'+inverted+'>';
			                  html += '<div class="timeline-image"><h4>'+item.time.substring(0,5)+'</h4></div>';
			                  html += '<div class="timeline-panel">';
			                    html += '<div class="timeline-heading">';
			                      html += '<h4>'+item.title+'</h4>';
			                    html += '</div>';
			                    html += '<div class="timeline-body">'+item.description+'</div>';
			                  html += '</div>';
			                html += '</li>';
										}
		              html += '</ul>';
								html += '</div>';
								html += '<div class="events-page hide" data-page="menu">';
									html += '<p><h2>Menu</h2></p>';
									if(data.this.raw.menuKid != '' && data.this.raw.menuKid != null){
										html += '<div class="btn-group btn-block">';
											html += '<button class="btn btn-outline-warning btn-lg active" data-menu="adult">Adulte</button>';
											html += '<button class="btn btn-outline-warning btn-lg" data-menu="kid">Enfant</button>';
										html += '</div>';
									}
									html += '<div class="events-menus mt-4">';
										html += '<div class="events-menu active" data-menu="adult">';
											html += data.this.raw.menuAdult;
										html += '</div>';
										html += '<div class="events-menu hide" data-menu="kid">';
											html += data.this.raw.menuKid;
										html += '</div>';
									html += '</div>';
								html += '</div>';
							html += '</div>';
					  html += '</div>';
					html += '</div>';
					$('body').prepend(html);
					var events = $('body').find('div.events-content-wrapper').first();
					var nav = events.find('nav.navbar').first();
					var pages = events.find('div.events-pages').first();
					var menus = events.find('div.events-menus').first();
					var pictures = events.find('div.events-page[data-page="gallery"]').first();
					$('#events-1 button').off().click(function(){
						$('#events-1').fadeOut('slow','swing',function(){
							$('#events-2').fadeIn('slow','swing');
						});
					});
					$('div.events-content-wrapper button[data-action="ControlPanel"]').off().click(function(){
						$('div.wrapper').show();
						$('div.events-content-wrapper').fadeOut('slow','swing');
					});
					nav.find('a[data-page]').off().click(function(){
						var page = $(this).attr('data-page');
						nav.find('a[data-page]').removeClass('active');
						$(this).addClass('active');
						pages.find('div[data-page].active').removeClass('active').fadeOut('slow','swing',function(){
							pages.find('div[data-page="'+page+'"]').addClass('active').fadeIn('slow','swing');
						});
					});
					pages.find('div[data-page="menu"]').find('div.btn-group button').off().click(function(){
						var menu = $(this).attr('data-menu');
						pages.find('div[data-page="menu"]').find('div.btn-group button.active').removeClass('active');
						$(this).addClass('active');
						menus.find('div[data-menu].active').removeClass('active').fadeOut('slow','swing',function(){
							menus.find('div[data-menu="'+menu+'"]').addClass('active').fadeIn('slow','swing');
						});
					});
					pictures.find('div.download-modal[data-file][data-basename]').off().click(function(){
						var file = $(this).attr('data-file');
						var basename = $(this).attr('data-basename');
						API.Helper.download(file,basename);
					});
				} else { $('div.wrapper').show(); }
			});
		},
	},
	Events:{
		notes:function(dataset,layout,options = {},callback = null){
			if(options instanceof Function){ callback = options; options = {}; }
			var defaults = {field: "name"};
			if(API.Helper.isSet(options,['field'])){ defaults.field = options.field; }
			if(API.Auth.validate('custom', 'organizations_notes', 2)){
				layout.content.notes.find('button').off().click(function(){
				  if(!layout.content.notes.find('textarea').summernote('isEmpty')){
				    var note = {
				      by:API.Contents.Auth.User.id,
				      content:layout.content.notes.find('textarea').summernote('code'),
				      relationship:'organizations',
				      link_to:dataset.this.dom.id,
				      status:dataset.this.raw.status,
				    };
				    if(API.Helper.isSet(API.Plugins,['statuses']) && API.Auth.validate('custom', 'organizations_status', 1)){
				      note.status = layout.content.notes.find('select').val();
				    }
				    layout.content.notes.find('textarea').val('');
				    layout.content.notes.find('textarea').summernote('code','');
				    layout.content.notes.find('textarea').summernote('destroy');
				    layout.content.notes.find('textarea').summernote({
				      toolbar: [
				        ['font', ['fontname', 'fontsize']],
				        ['style', ['bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript', 'clear']],
				        ['color', ['color']],
				        ['paragraph', ['style', 'ul', 'ol', 'paragraph', 'height']],
				      ],
				      height: 250,
				    });
				    API.request('organizations','note',{data:note},function(result){
				      var data = JSON.parse(result);
				      if(data.success != undefined){
				        if(data.output.status != null){
				          var status = {};
				          for(var [key, value] of Object.entries(data.output.status)){ status[key] = value; }
				          status.created = data.output.note.raw.created;
				          API.Builder.Timeline.add.status(layout.timeline,status);
				          layout.content.notes.find('select').val(status.order);
				          layout.details.find('td[data-plugin="organizations"][data-key="status"]').html('<span class="badge bg-'+API.Contents.Statuses.organizations[status.order].color+'"><i class="'+API.Contents.Statuses.organizations[status.order].icon+' mr-1" aria-hidden="true"></i>'+API.Contents.Language[API.Contents.Statuses.organizations[status.order].name]+'</span>');
				        }
				        API.Builder.Timeline.add.card(layout.timeline,data.output.note.dom,'sticky-note','warning',function(item){
				          item.find('.timeline-footer').remove();
				          if(API.Auth.validate('custom', 'organizations_notes', 4)){
				            $('<a class="time bg-warning pointer"><i class="fas fa-trash-alt"></i></a>').insertAfter(item.find('span.time.bg-warning'));
										item.find('a.pointer').off().click(function(){
											API.CRUD.delete.show({ keys:data.output.note.dom,key:'id', modal:true, plugin:'notes' },function(note){
												item.remove();
											});
										});
				          }
				        });
				      }
				    });
				    layout.tabs.find('a').first().tab('show');
				  } else {
				    layout.content.notes.find('textarea').summernote('destroy');
				    layout.content.notes.find('textarea').summernote({
				      toolbar: [
				        ['font', ['fontname', 'fontsize']],
				        ['style', ['bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript', 'clear']],
				        ['color', ['color']],
				        ['paragraph', ['style', 'ul', 'ol', 'paragraph', 'height']],
				      ],
				      height: 250,
				    });
				    alert(API.Contents.Language['Note is empty']);
				  }
				});
			}
		},
	},
}

API.Plugins.events.init();
