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
							// Page
							if(API.Auth.validate('custom', 'events_page', 1)){
								API.GUI.Layouts.details.control(data,layout,{color:"info",icon:"fas fa-globe",text:API.Contents.Language["Page"]},function(data,layout,button){
									button.off().click(function(){
										API.GUI.Breadcrumbs.add(data.this.raw.name, '?p=events&v=page&id='+data.this.raw.id);
										API.CRUD.read.show({ href:'?p=events&v=page&id='+data.this.raw.id});
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
							// Contacts
							if(API.Helper.isSet(API.Plugins,['contacts']) && API.Auth.validate('custom', 'events_contacts', 1)){
								API.GUI.Layouts.details.tab(data,layout,{icon:"fas fa-address-book",text:API.Contents.Language["Contacts"]},function(data,layout,tab,content){
									layout.timeline.find('.time-label').first().find('div.btn-group').append('<button class="btn btn-secondary" data-table="contacts">'+API.Contents.Language['Contacts']+'</button>');
									layout.content.contacts = content;
									layout.tabs.contacts = tab;
									content.addClass('p-3');
									var html = '';
									html += '<div class="row">';
										html += '<div class="col-md-12 mb-3">';
											html += '<div class="input-group">';
												html += '<input type="text" class="form-control">';
												html += '<div class="input-group-append pointer" data-action="clear">';
													html += '<span class="input-group-text"><i class="fas fa-times" aria-hidden="true"></i></span>';
												html += '</div>';
												html += '<div class="input-group-append">';
													html += '<span class="input-group-text"><i class="icon icon-search mr-1"></i>'+API.Contents.Language["Search"]+'</span>';
												html += '</div>';
											html += '</div>';
										html += '</div>';
									html += '</div>';
									html += '<div class="row"></div>';
									content.append(html);
									area = content.find('div.row').last();
									if(API.Auth.validate('custom', 'events_contacts', 2)){
										var html = '';
										html += '<div class="col-sm-12 col-md-6">';
											html += '<div class="card pointer addContact">';
												html += '<div class="card-body py-4">';
													html += '<div class="text-center p-5">';
														html += '<i class="fas fa-plus-circle fa-10x mt-3 mb-2"></i>';
													html += '</div>';
												html += '</div>';
											html += '</div>';
										html += '</div>';
										area.append(html);
									}
									if(API.Helper.isSet(data,['relations','contacts'])){
										for(var [id, relation] of Object.entries(data.relations.contacts)){
											if(relation.isActive||API.Auth.validate('custom', 'events_contacts_isActive', 1)){
												API.Plugins.events.GUI.contact(relation,layout);
											}
										}
									}
								});
								API.Plugins.events.Events.contacts(data,layout);
							}
							// Hosts
							if(API.Helper.isSet(API.Plugins,['users']) && API.Auth.validate('custom', 'events_hosts', 1)){
								if(layout.timeline.find('.time-label').first().find('div.btn-group button[data-table="users"]').length <= 0){
									layout.timeline.find('.time-label').first().find('div.btn-group').append('<button class="btn btn-secondary" data-table="users">'+API.Contents.Language['Hosts']+'</button>');
								}
								options.field = "setHosts";
								options.td = '<td data-plugin="events" data-key="'+options.field+'"></td>';
								API.GUI.Layouts.details.data(data,layout,options,function(data,layout,tr){
									var td = tr.find('td[data-plugin="events"][data-key="'+options.field+'"]');
									if(API.Helper.isSet(data.details,['users'])){
										if(data.this.raw.setHosts == null){ data.this.raw.setHosts = ''; }
										for(var [subKey, subDetails] of Object.entries(API.Helper.trim(data.this.raw[options.field],';').split(';'))){
											if(subDetails != ''){
												var user = data.details.users.dom[subDetails];
												td.append(
													API.Plugins.events.GUI.buttons.details(user,{
														remove:API.Auth.validate('custom', 'events_hosts', 4),
														key: "username",
														icon:{
															details:"fas fa-user",
															remove:"fas fa-user-minus",
														},
														action:{
															remove:"unassign",
														},
													})
												);
											}
										}
									}
									if(API.Auth.validate('custom', 'events_hosts', 2)){
										td.append('<button type="button" class="btn btn-xs btn-success mx-1" data-action="assign"><i class="fas fa-user-plus"></i></button>');
									}
									API.Plugins.events.Events.users(data,layout);
								});
							}
							// Planners
							if(API.Helper.isSet(API.Plugins,['users']) && API.Auth.validate('custom', 'events_planners', 1)){
								if(layout.timeline.find('.time-label').first().find('div.btn-group button[data-table="users"]').length <= 0){
									layout.timeline.find('.time-label').first().find('div.btn-group').append('<button class="btn btn-secondary" data-table="users">'+API.Contents.Language['Hosts']+'</button>');
								}
								options.field = "setHosts";
								options.td = '<td data-plugin="events" data-key="'+options.field+'"></td>';
								API.GUI.Layouts.details.data(data,layout,options,function(data,layout,tr){
									var td = tr.find('td[data-plugin="events"][data-key="'+options.field+'"]');
									if(API.Helper.isSet(data.details,['users'])){
										if(data.this.raw.setHosts == null){ data.this.raw.setHosts = ''; }
										for(var [subKey, subDetails] of Object.entries(API.Helper.trim(data.this.raw[options.field],';').split(';'))){
											if(subDetails != ''){
												var user = data.details.users.dom[subDetails];
												td.append(
													API.Plugins.events.GUI.buttons.details(user,{
														remove:API.Auth.validate('custom', 'events_planners', 4),
														key: "username",
														icon:{
															details:"fas fa-user",
															remove:"fas fa-user-minus",
														},
														action:{
															remove:"unassign",
														},
													})
												);
											}
										}
									}
									if(API.Auth.validate('custom', 'events_planners', 2)){
										td.append('<button type="button" class="btn btn-xs btn-success mx-1" data-action="assign"><i class="fas fa-user-plus"></i></button>');
									}
									API.Plugins.events.Events.users(data,layout);
								});
							}
							// Staffs
							if(API.Helper.isSet(API.Plugins,['users']) && API.Auth.validate('custom', 'events_staffs', 1)){
								if(layout.timeline.find('.time-label').first().find('div.btn-group button[data-table="users"]').length <= 0){
									layout.timeline.find('.time-label').first().find('div.btn-group').append('<button class="btn btn-secondary" data-table="users">'+API.Contents.Language['Hosts']+'</button>');
								}
								options.field = "setStaffs";
								options.td = '<td data-plugin="events" data-key="'+options.field+'"></td>';
								API.GUI.Layouts.details.data(data,layout,options,function(data,layout,tr){
									var td = tr.find('td[data-plugin="events"][data-key="'+options.field+'"]');
									if(API.Helper.isSet(data.details,['users'])){
										if(data.this.raw.setHosts == null){ data.this.raw.setHosts = ''; }
										for(var [subKey, subDetails] of Object.entries(API.Helper.trim(data.this.raw[options.field],';').split(';'))){
											if(subDetails != ''){
												var user = data.details.users.dom[subDetails];
												td.append(
													API.Plugins.events.GUI.buttons.details(user,{
														remove:API.Auth.validate('custom', 'events_staffs', 4),
														key: "username",
														icon:{
															details:"fas fa-user",
															remove:"fas fa-user-minus",
														},
														action:{
															remove:"unassign",
														},
													})
												);
											}
										}
									}
									if(API.Auth.validate('custom', 'events_staffs', 2)){
										td.append('<button type="button" class="btn btn-xs btn-success mx-1" data-action="assign"><i class="fas fa-user-plus"></i></button>');
									}
									API.Plugins.events.Events.users(data,layout);
								});
							}
							// Continue
							// Created
							options.field = "created";
							options.td = '<td><time class="timeago" datetime="'+data.this.raw.created.replace(/ /g, "T")+'" title="'+data.this.raw.created+'">'+data.this.raw.created+'</time></td>';
							API.GUI.Layouts.details.data(data,layout,options,function(data,layout,tr){ tr.find('time').timeago(); });
							// Timeline
							for(var [rid, relations] of Object.entries(data.relationships)){
								for(var [uid, relation] of Object.entries(relations)){
									if(API.Helper.isSet(API.Plugins,[relation.relationship]) && (API.Auth.validate('custom', 'events_'+relation.relationship, 1) || relation.owner == API.Contents.Auth.User.username) && API.Helper.isSet(data,['relations',relation.relationship,relation.link_to])){
										var details = {};
										for(var [key, value] of Object.entries(data.relations[relation.relationship][relation.link_to])){ details[key] = value; }
										if(typeof relation.statuses !== 'undefined'){ details.status = data.details.statuses.dom[relation.statuses].order; }
										details.created = relation.created;
										details.owner = relation.owner;
										if(!API.Helper.isSet(details,['isActive'])||(API.Helper.isSet(details,['isActive']) && details.isActive)||(API.Helper.isSet(details,['isActive']) && !details.isActive && (API.Auth.validate('custom', 'events_'+relation.relationship+'_isActive', 1)||API.Auth.validate('custom', relation.relationship+'_isActive', 1)))){
											switch(relation.relationship){
												case"notes":
													API.Builder.Timeline.add.card(layout.timeline,details,'sticky-note','warning',function(item){
														item.find('.timeline-footer').remove();
														if(API.Auth.validate('custom', 'events_notes', 4)){
															$('<a class="time bg-warning pointer"><i class="fas fa-trash-alt"></i></a>').insertAfter(item.find('span.time.bg-warning'));
															item.find('a.pointer').off().click(function(){
																API.CRUD.delete.show({ keys:data.relations.notes[item.attr('data-id')],key:'id', modal:true, plugin:'notes' },function(note){
																	item.remove();
																});
															});
														}
													});
													break;
												case"contacts":
													API.Builder.Timeline.add.contact(layout.timeline,details,'address-card','secondary',function(item){
														item.find('i').first().addClass('pointer');
														item.find('i').first().off().click(function(){
															value = item.attr('data-name').toLowerCase();
															layout.content.contacts.find('input').val(value);
															layout.tabs.contacts.find('a').tab('show');
															layout.content.contacts.find('[data-csv]').hide();
															layout.content.contacts.find('[data-csv*="'+value+'"]').each(function(){ $(this).show(); });
														});
													});
													break;
												case"users":
													API.Builder.Timeline.add.subscription(layout.timeline,details,'bell','lightblue',function(item){
														if((API.Auth.validate('plugin','users',1))&&(API.Auth.validate('view','details',1,'users'))){
															item.find('i').first().addClass('pointer');
															item.find('i').first().off().click(function(){
																API.CRUD.read.show({ key:'username',keys:data.details.users.dom[item.attr('data-id')], href:"?p=users&v=details&id="+data.details.users.dom[item.attr('data-id')].username, modal:true });
															});
														}
													});
													break;
											}
										}
									}
								}
							}
							layout.timeline.find('.time-label').first().find('div.btn-group button').off().click(function(){
								var filters = layout.timeline.find('.time-label').first().find('div.btn-group');
								var all = filters.find('button').first();
								if($(this).attr('data-table') != 'all'){
									if(all.hasClass("btn-primary")){ all.removeClass('btn-primary').addClass('btn-secondary'); }
									if($(this).hasClass("btn-secondary")){ $(this).removeClass('btn-secondary').addClass('btn-primary'); }
									else { $(this).removeClass('btn-primary').addClass('btn-secondary'); }
									layout.timeline.find('[data-type]').hide();
									layout.timeline.find('.time-label').first().find('div.btn-group button.btn-primary').each(function(){
										switch($(this).attr('data-table')){
											case"notes":var icon = 'sticky-note';break;
											case"comments":var icon = 'comment';break;
											case"users":var icon = 'bell';break;
											case"contacts":var icon = 'address-card';break;
										}
										if((icon != '')&&(typeof icon !== 'undefined')){ layout.timeline.find('[data-type="'+icon+'"]').show(); }
									});
								} else {
									filters.find('button').removeClass('btn-primary').addClass('btn-secondary');
									all.removeClass('btn-secondary').addClass('btn-primary');
									layout.timeline.find('[data-type]').show();
								}
							});
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
	GUI:{
		contact:function(dataset,layout,plugin = 'contacts'){
			var area = layout.content[plugin].find('div.row').eq(1);
			area.prepend(API.Plugins.events.GUI.card(dataset));
			var card = area.find('div.col-sm-12.col-md-6').first();
			if(API.Auth.validate('custom', 'events_'+plugin+'_btn_share', 1)){
				card.find('div.btn-group').append(API.Plugins.events.GUI.button(dataset,{id:'id',color:'navy',icon:'fas fa-share-alt',action:'share',content:API.Contents.Language['Share']}));
			}
			if(API.Auth.validate('custom', 'events_'+plugin+'_btn_edit', 1)){
				card.find('div.btn-group').append(API.Plugins.events.GUI.button(dataset,{id:'id',color:'warning',icon:'fas fa-edit',action:'edit',content:API.Contents.Language['Edit']}));
			}
			if(API.Auth.validate('custom', 'events_'+plugin+'_btn_delete', 1)){
				card.find('div.btn-group').append(API.Plugins.events.GUI.button(dataset,{id:'id',color:'danger',icon:'fas fa-trash-alt',action:'delete',content:''}));
			}
		},
		button:function(dataset,options = {}){
			var defaults = {
				icon:"fas fa-building",
				action:"details",
				color:"primary",
				key:"name",
				id:"id",
				content:"",
			};
			if(API.Helper.isSet(options,['icon'])){ defaults.icon = options.icon; }
			if(API.Helper.isSet(options,['action'])){ defaults.action = options.action; }
			if(API.Helper.isSet(options,['color'])){ defaults.color = options.color; }
			if(API.Helper.isSet(options,['key'])){ defaults.key = options.key; }
			if(API.Helper.isSet(options,['id'])){ defaults.id = options.id; }
			if(API.Helper.isSet(options,['content'])){ defaults.content = options.content; }
			else { defaults.content = dataset[defaults.key]; }
			if(defaults.content != ''){ defaults.icon += ' mr-1'; }
			return '<button type="button" class="btn btn-sm bg-'+defaults.color+'" data-id="'+dataset[defaults.id]+'" data-action="'+defaults.action+'"><i class="'+defaults.icon+'"></i>'+defaults.content+'</button>';
		},
		buttons:{
			details:function(dataset,options = {}){
				var defaults = {
					icon:{details:"fas fa-building",remove:"fas fa-unlink"},
					action:{details:"details",remove:"unlink"},
					color:{details:"primary",remove:"danger"},
					key:"name",
					id:"id",
					content:"",
					remove:false,
				};
				if(API.Helper.isSet(options,['icon','details'])){ defaults.icon.details = options.icon.details; }
				if(API.Helper.isSet(options,['icon','remove'])){ defaults.icon.remove = options.icon.remove; }
				if(API.Helper.isSet(options,['color','details'])){ defaults.color.details = options.color.details; }
				if(API.Helper.isSet(options,['color','remove'])){ defaults.color.remove = options.color.remove; }
				if(API.Helper.isSet(options,['action','details'])){ defaults.action.details = options.action.details; }
				if(API.Helper.isSet(options,['action','remove'])){ defaults.action.remove = options.action.remove; }
				if(API.Helper.isSet(options,['key'])){ defaults.key = options.key; }
				if(API.Helper.isSet(options,['id'])){ defaults.id = options.id; }
				if(API.Helper.isSet(options,['remove'])){ defaults.remove = options.remove; }
				if(API.Helper.isSet(options,['content'])){ defaults.content = options.content; }
				else { defaults.content = dataset[defaults.key]; }
				var html = '';
				html += '<div class="btn-group m-1" data-id="'+dataset[defaults.id]+'">';
					html += '<button type="button" class="btn btn-xs bg-'+defaults.color.details+'" data-id="'+dataset[defaults.id]+'" data-action="'+defaults.action.details+'"><i class="'+defaults.icon.details+' mr-1"></i>'+defaults.content+'</button>';
					if(defaults.remove){
						html += '<button type="button" class="btn btn-xs bg-'+defaults.color.remove+'" data-id="'+dataset[[defaults.id]]+'" data-action="'+defaults.action.remove+'"><i class="'+defaults.icon.remove+'"></i></button>';
					}
				html += '</div>';
				return html;
			},
		},
		card:function(dataset,options = {}){
			var csv = '';
			for(var [key, value] of Object.entries(dataset)){
				if(value == null){ value = '';dataset[key] = value; };
				if(jQuery.inArray(key,['first_name','middle_name','last_name','name','email','phone','mobile','office_num','other_num','about','job_title']) != -1){
					if(typeof value == 'string'){ csv += value.replace(',','').toLowerCase()+','; }
					else { csv += value+','; }
				}
			}
			var html = '';
			html += '<div class="col-sm-12 col-md-6 contactCard" data-csv="'+csv+'" data-id="'+dataset.id+'">';
			  html += '<div class="card">';
					if(!dataset.isActive){ html += '<div class="ribbon-wrapper ribbon-xl"><div class="ribbon bg-danger text-xl">'+API.Contents.Language['Inactive']+'</div></div>'; }
			    html += '<div class="card-header border-bottom-0">';
			      html += '<b class="mr-1">Title:</b>'+dataset.job_title;
			    html += '</div>';
			    html += '<div class="card-body pt-0">';
			      html += '<div class="row">';
			        html += '<div class="col-7">';
			          html += '<h2 class="lead"><b>'+dataset.name+'</b></h2>';
			          html += '<p class="text-sm"><b>About: </b> '+dataset.about+' </p>';
			          html += '<ul class="ml-4 mb-0 fa-ul">';
			            html += '<li class="small"><span class="fa-li"><i class="fas fa-lg fa-at"></i></span><b class="mr-1">Email:</b><a href="mailto:'+dataset.email+'">'+dataset.email+'</a></li>';
			            html += '<li class="small"><span class="fa-li"><i class="fas fa-lg fa-phone"></i></span><b class="mr-1">Phone #:</b><a href="tel:'+dataset.phone+'">'+dataset.phone+'</a></li>';
			            html += '<li class="small"><span class="fa-li"><i class="fas fa-lg fa-phone"></i></span><b class="mr-1">Office #:</b><a href="tel:'+dataset.office_num+'">'+dataset.office_num+'</a></li>';
			            html += '<li class="small"><span class="fa-li"><i class="fas fa-lg fa-mobile"></i></span><b class="mr-1">Mobile #:</b><a href="tel:'+dataset.mobile+'">'+dataset.mobile+'</a></li>';
			            html += '<li class="small"><span class="fa-li"><i class="fas fa-lg fa-phone"></i></span><b class="mr-1">Other #:</b><a href="tel:'+dataset.other_num+'">'+dataset.other_num+'</a></li>';
			          html += '</ul>';
			        html += '</div>';
			        html += '<div class="col-5 text-center">';
			          html += '<img src="/dist/img/default.png" alt="user-avatar" class="img-circle img-fluid">';
			        html += '</div>';
			      html += '</div>';
			    html += '</div>';
			    html += '<div class="card-footer">';
			      html += '<div class="text-right">';
			        html += '<div class="btn-group"></div>';
			      html += '</div>';
			    html += '</div>';
			  html += '</div>';
			html += '</div>';
			return html;
		},
	},
	Events:{
		users:function(dataset,layout,options = {},callback = null){
			if(options instanceof Function){ callback = options; options = {}; }
			var defaults = {field: "name"};
			if(API.Helper.isSet(options,['field'])){ defaults.field = options.field; }
			var td = layout.details.find('td[data-plugin="events"][data-key="setHosts"]');
			td.find('button').off().click(function(){
				var button = $(this);
				if(button.attr('data-action') != "assign"){
					if(API.Helper.isSet(API.Contents,['data','raw','users',button.attr('data-id')])){
						var user = {raw:API.Contents.data.raw.users[button.attr('data-id')],dom:{}};
						user.dom = API.Contents.data.dom.users[user.raw.username];
					} else {
						var user = {
							dom:dataset.details.users.dom[button.attr('data-id')],
							raw:dataset.details.users.raw[button.attr('data-id')],
						};
					}
				}
				switch(button.attr('data-action')){
					case"details":
						API.CRUD.read.show({ key:'username',keys:user.dom, href:"?p=users&v=details&id="+user.raw.username, modal:true });
						break;
					case"unassign":
						API.request('events','unassign',{data:{id:dataset.this.raw.id,user:button.attr('data-id')}},function(result){
							var sub_dataset = JSON.parse(result);
							if(sub_dataset.success != undefined){
								td.find('.btn-group[data-id="'+sub_dataset.output.user+'"]').remove();
							}
						});
						break;
					case"assign":
						API.Builder.modal($('body'), {
							title:'Assign a user',
							icon:'user',
							zindex:'top',
							css:{ header: "bg-gray", body: "p-3"},
						}, function(modal){
							modal.on('hide.bs.modal',function(){ modal.remove(); });
							var dialog = modal.find('.modal-dialog');
							var header = modal.find('.modal-header');
							var body = modal.find('.modal-body');
							var footer = modal.find('.modal-footer');
							header.find('button[data-control="hide"]').remove();
							header.find('button[data-control="update"]').remove();
							API.Builder.input(body, 'user', null, function(input){});
							footer.append('<button class="btn btn-secondary" data-action="assign"><i class="fas fa-user-plus mr-1"></i>'+API.Contents.Language['Assign']+'</button>');
							footer.find('button[data-action="assign"]').click(function(){
								if((typeof body.find('select').select2('val') !== "undefined")&&(body.find('select').select2('val') != '')){
									API.request('events','assign',{data:{id:dataset.this.dom.id,user:body.find('select').select2('val')}},function(result){
										var sub_dataset = JSON.parse(result);
										if(sub_dataset.success != undefined){
											for(var [key, user] of Object.entries(sub_dataset.output.organization.raw.setHosts.split(';'))){
												if(user != '' && td.find('div.btn-group[data-id="'+user+'"]').length <= 0){
													user = {
														dom:sub_dataset.output.users.dom[user],
														raw:sub_dataset.output.users.raw[user],
													};
													API.Helper.set(API.Contents,['data','dom','users',user.dom.username],user.dom);
													API.Helper.set(API.Contents,['data','raw','users',user.raw.id],user.raw);
													API.Helper.set(dataset.details,['users','dom',user.dom.id],user.dom);
													API.Helper.set(dataset.details,['users','dom',user.raw.id],user.raw);
													var html = API.Plugins.events.GUI.buttons.details(user.dom,{
														remove:API.Auth.validate('custom', 'events_users', 4),
													  key: "username",
													  icon:{
													    details:"fas fa-user",
													    remove:"fas fa-user-minus",
													  },
													  action:{
													    remove:"unassign",
													  },
													});
													if(td.find('button[data-action="assign"]').length > 0){
														td.find('button[data-action="assign"]').before(html);
													} else { td.append(html); }
												}
											}
											API.Plugins.events.Events.users(dataset,layout);
										}
									});
									modal.modal('hide');
								} else {
									body.find('.input-group').addClass('is-invalid');
									alert('No organization were selected!');
								}
							});
							modal.modal('show');
						});
						break;
				}
			});
			if(callback != null){ callback(dataset,layout); }
		},
		notes:function(dataset,layout,options = {},callback = null){
			if(options instanceof Function){ callback = options; options = {}; }
			var defaults = {field: "name"};
			if(API.Helper.isSet(options,['field'])){ defaults.field = options.field; }
			if(API.Auth.validate('custom', 'events_notes', 2)){
				layout.content.notes.find('button').off().click(function(){
				  if(!layout.content.notes.find('textarea').summernote('isEmpty')){
				    var note = {
				      by:API.Contents.Auth.User.id,
				      content:layout.content.notes.find('textarea').summernote('code'),
				      relationship:'events',
				      link_to:dataset.this.dom.id,
				      status:dataset.this.raw.status,
				    };
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
				    API.request('events','note',{data:note},function(result){
				      var data = JSON.parse(result);
				      if(data.success != undefined){
				        API.Builder.Timeline.add.card(layout.timeline,data.output.note.dom,'sticky-note','warning',function(item){
				          item.find('.timeline-footer').remove();
				          if(API.Auth.validate('custom', 'events_notes', 4)){
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
		contacts:function(dataset,layout,options = {},callback = null){
			if(options instanceof Function){ callback = options; options = {}; }
			var defaults = {field: "name"};
			if(API.Helper.isSet(options,['field'])){ defaults.field = options.field; }
			var contacts = layout.content.contacts.find('div.row').eq(1);
			var search = layout.content.contacts.find('div.row').eq(0);
			var skeleton = {};
			for(var [field, settings] of Object.entries(API.Contents.Settings.Structure.contacts)){ skeleton[field] = ''; }
			search.find('div[data-action="clear"]').off().click(function(){
				$(this).parent().find('input').val('');
				contacts.find('[data-csv]').show();
			});
			search.find('input').off().on('input',function(){
				if($(this).val() != ''){
					contacts.find('[data-csv]').hide();
					contacts.find('[data-csv*="'+$(this).val().toLowerCase()+'"]').each(function(){ $(this).show(); });
				} else { contacts.find('[data-csv]').show(); }
			});
			if(API.Auth.validate('custom', 'events_contacts', 2)){
				contacts.find('.addContact').off().click(function(){
					API.CRUD.create.show({ plugin:'contacts', keys:skeleton, set:{isActive:'true',relationship:'events',link_to:dataset.this.raw.id} },function(created,user){
						if(created){
							user.dom.name = '';
							if((user.dom.first_name != '')&&(user.dom.first_name != null)){ if(user.dom.name != ''){user.dom.name += ' ';} user.dom.name += user.dom.first_name; }
							if((user.dom.middle_name != '')&&(user.dom.middle_name != null)){ if(user.dom.name != ''){user.dom.name += ' ';} user.dom.name += user.dom.middle_name; }
							if((user.dom.last_name != '')&&(user.dom.last_name != null)){ if(user.dom.name != ''){user.dom.name += ' ';} user.dom.name += user.dom.last_name; }
							API.Helper.set(dataset,['details','contacts','dom',user.dom.id],user.dom);
							API.Helper.set(dataset,['details','contacts','raw',user.raw.id],user.raw);
							API.Helper.set(dataset,['relations','contacts',user.dom.id],user.dom);
							API.Plugins.events.GUI.contact(user.dom,layout);
							API.Plugins.events.Events.contacts(dataset,layout);
							API.Builder.Timeline.add.contact(layout.timeline,user.dom,'address-card','secondary',function(item){
								item.find('i').first().addClass('pointer');
								item.find('i').first().off().click(function(){
									value = item.attr('data-name').toLowerCase();
									layout.content.contacts.find('input').val(value);
									layout.tabs.contacts.find('a').tab('show');
									layout.content.contacts.find('[data-csv]').hide();
									layout.content.contacts.find('[data-csv*="'+value+'"]').each(function(){ $(this).show(); });
								});
							});
						}
					});
				});
			}
			contacts.find('button').off().click(function(){
				var contact = dataset.relations.contacts[$(this).attr('data-id')];
				switch($(this).attr('data-action')){
					case"call":
						var now = new Date();
						var call = {
							date:now,
							time:now,
							contact:contact.id,
							status:3,
							setHosts:API.Contents.Auth.User.id,
							relationship:'events',
							link_to:dataset.this.raw.id,
						};
						API.request('calls','create',{data:call},function(result){
							var record = JSON.parse(result);
							if(typeof record.success !== 'undefined'){
								API.Helper.set(dataset,['details','calls','dom',record.output.dom.id],record.output.dom);
								API.Helper.set(dataset,['details','calls','raw',record.output.raw.id],record.output.raw);
								API.Helper.set(dataset,['relations','calls',record.output.dom.id],record.output.dom);
								API.Plugins.calls.Events.create(dataset,record.output.raw);
							}
						});
						break;
					case"edit":
						API.CRUD.update.show({ keys:contact, modal:true, plugin:'contacts' },function(user){
							user.dom.name = '';
							if((user.dom.first_name != '')&&(user.dom.first_name != null)){ if(user.dom.name != ''){user.dom.name += ' ';} user.dom.name += user.dom.first_name; }
							if((user.dom.middle_name != '')&&(user.dom.middle_name != null)){ if(user.dom.name != ''){user.dom.name += ' ';} user.dom.name += user.dom.middle_name; }
							if((user.dom.last_name != '')&&(user.dom.last_name != null)){ if(user.dom.name != ''){user.dom.name += ' ';} user.dom.name += user.dom.last_name; }
							API.Helper.set(dataset,['relations','contacts',user.dom.id],user.dom);
							contacts.find('[data-id="'+user.raw.id+'"]').remove();
							API.Plugins.events.GUI.contact(user.dom,layout);
							API.Plugins.events.Events.contacts(dataset,layout);
						});
						break;
					case"delete":
						contact.link_to = dataset.this.raw.id;
						API.CRUD.delete.show({ keys:contact,key:'name', modal:true, plugin:'contacts' },function(user){
							if(contacts.find('[data-id="'+contact.id+'"]').find('.ribbon-wrapper').length > 0 || !API.Auth.validate('custom', 'events_contacts_isActive', 1)){
								contacts.find('[data-id="'+contact.id+'"]').remove();
								layout.timeline.find('[data-type="address-card"][data-id="'+contact.id+'"]').remove();
							}
							if(contact.isActive && API.Auth.validate('custom', 'events_contacts_isActive', 1)){
								contact.isActive = user.isActive;
								API.Helper.set(dataset,['relations','contacts',contact.id,'isActive'],contact.isActive);
								contacts.find('[data-id="'+contact.id+'"] .card').prepend('<div class="ribbon-wrapper ribbon-xl"><div class="ribbon bg-danger text-xl">'+API.Contents.Language['Inactive']+'</div></div>');
							}
						});
						break;
				}
			});
			if(callback != null){ callback(dataset,layout); }
		},
	},
}

API.Plugins.events.init();
