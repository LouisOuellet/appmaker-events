<?php
class eventsAPI extends CRUDAPI {

	public function upload($request = null, $data = null){
		var_dump($data);
		if(isset($data)){
			if(!is_array($data)){ $data = json_decode($data, true); }
			$data['dirname'] = $this->scan($data['event'])['dirname'];
			$data['encoding'] = trim(explode(",",$data['dataURL'])[0],' ');
			if(strpos($data['encoding'],'base64') !== false){ $data['content'] = base64_decode(trim(explode(",",$data['dataURL'])[1],' ')); }
			else { $data['content'] = trim(explode(",",$data['dataURL'])[1],' '); }
			if(!is_file($data['dirname'].'/'.$data['filename'])){
				$picture = fopen($data['dirname'].'/'.$data['filename'], "w");
				fwrite($picture, $data['content']);
				fclose($picture);
				$pictures = $this->scan($data['event'])['pictures'];
				foreach($pictures as $basename => $picture){
					if($picture['filename'] == $data['filename']){ $found = $picture; }
				}
				// Return
				unset($data['dataURL']);
				if(isset($found) && !empty($found)){
					return [
						"success" => $this->Language->Field["Picture saved!"],
						"request" => $request,
						"data" => $data,
						"output" => [
							'picture' => $found,
						],
					];
				} else {
					return [
						"error" => $this->Language->Field["Unable to upload this picture"],
						"request" => $request,
						"data" => $data,
					];
				}
			} else {
				// Return
				unset($data['dataURL']);
				return [
					"error" => $this->Language->Field["Picture already exist"],
					"request" => $request,
					"data" => $data,
				];
			}
		}
	}

	protected function scan($id){
		// Scan Gallery
		$gallery = 'data/events/'.$id.'/gallery';
		$gallery = $this->Auth->query('SELECT * FROM `galleries` WHERE `dirname` = ?',$gallery);
		if($gallery->numRows() > 0){
			$gallery = $gallery->fetchAll()->All()[0];
		} else {
			$gallery = 'data/events/'.$id.'/gallery';
			$gallery = $this->Auth->create('galleries',['dirname' => $gallery]);
			$gallery = $this->Auth->read('galleries',$gallery)->all()[0];
			$this->createRelationship([
				'relationship_1' => 'events',
				'link_to_1' => $id,
				'relationship_2' => 'galleries',
				'link_to_2' => $gallery['id'],
			]);
		}
		$files = $this->Auth->query('SELECT * FROM `pictures` WHERE `dirname` = ?',$gallery['dirname']);
		if($files->numRows() > 0){
			$files = $files->fetchAll()->All();
		} else { $files = []; }
		$pictures = [];
		foreach($files as $picture){ $pictures[$picture['basename']] = $picture; }
		if(is_file($gallery['dirname'])||is_dir($gallery['dirname'])){
			$files = scandir($gallery['dirname']);
			$files = array_diff($files, array('.', '..'));
			foreach($files as $key => $picture){
				if(!array_key_exists($picture,$pictures)){
					$picture = pathinfo($gallery['dirname'].'/'.$picture);
					$picture['size'] = filesize($gallery['dirname'].'/'.$picture['basename']);
					$picture['id'] = $this->Auth->create('pictures',$picture);
					if($picture['id'] != null){
						$pictures[$picture['basename']] = $this->Auth->read('pictures',$picture['id'])->all()[0];
						$this->createRelationship([
							'relationship_1' => 'galleries',
							'link_to_1' => $gallery['id'],
							'relationship_2' => 'pictures',
							'link_to_2' => $pictures[$picture['basename']]['id'],
						]);
					}
				}
			}
		} else { $this->mkdir('/data/events/'.$id.'/gallery'); }
		return [
			'dirname' => $gallery['dirname'],
			'pictures' => $pictures,
		];
	}

	public function get($request = null, $data = null){
		if(isset($data)){
			if(!is_array($data)){ $data = json_decode($data, true); }
			$this->Auth->setLimit(0);
			// Scan for pictures
			$this->scan($data['id']);
			// Load Event
			$get = parent::get('events', $data);
			// Load Items
			$items = $this->Auth->query('SELECT * FROM `event_items` WHERE `setEvent` = ?',$get['output']['this']['raw']['id']);
			if($items->numRows() > 0){
			  $items = $items->fetchAll()->All();
				foreach($items as $item){
					if(!isset($get['output']['details']['event_items']['raw'][$item['id']])){
						$get['output']['details']['event_items']['raw'][$item['id']] = $this->Auth->read('event_items',$item['id'])->all()[0];
						$get['output']['details']['event_items']['dom'][$item['id']] = $this->convertToDOM($get['output']['details']['event_items']['raw'][$item['id']]);
					}
				}
			}
			if(isset($get['success'],$get['output']['this']['raw']['setPlanners'])){
				if(!isset($get['output']['details']['users'])){ $get['output']['details']['users'] = ['dom' => [],'raw' => []]; }
				foreach(explode(";",trim($get['output']['this']['raw']['setPlanners'],";")) as $userID){
					if(!isset($get['output']['details']['users']['raw'][$userID])){
						$get['output']['details']['users']['raw'][$userID] = $this->Auth->read('users',$userID)->all()[0];
						$get['output']['details']['users']['dom'][$userID] = $this->convertToDOM($get['output']['details']['users']['raw'][$userID]);
					}
				}
			}
			// Load Planners
			if(isset($get['success'],$get['output']['this']['raw']['setPlanners'])){
				if(!isset($get['output']['details']['users'])){ $get['output']['details']['users'] = ['dom' => [],'raw' => []]; }
				foreach(explode(";",trim($get['output']['this']['raw']['setPlanners'],";")) as $userID){
					if(!isset($get['output']['details']['users']['raw'][$userID])){
						$get['output']['details']['users']['raw'][$userID] = $this->Auth->read('users',$userID)->all()[0];
						$get['output']['details']['users']['dom'][$userID] = $this->convertToDOM($get['output']['details']['users']['raw'][$userID]);
					}
				}
			}
			// Load Staffs
			if(isset($get['success'],$get['output']['this']['raw']['setStaffs'])){
				if(!isset($get['output']['details']['users'])){ $get['output']['details']['users'] = ['dom' => [],'raw' => []]; }
				foreach(explode(";",trim($get['output']['this']['raw']['setStaffs'],";")) as $userID){
					if(!isset($get['output']['details']['users']['raw'][$userID])){
						$get['output']['details']['users']['raw'][$userID] = $this->Auth->read('users',$userID)->all()[0];
						$get['output']['details']['users']['dom'][$userID] = $this->convertToDOM($get['output']['details']['users']['raw'][$userID]);
					}
				}
			}
			// Load Hosts
			if(isset($get['success'],$get['output']['this']['raw']['setHosts'])){
				if(!isset($get['output']['details'][$get['output']['this']['raw']['setHostType']])){ $get['output']['details']['users'] = ['dom' => [],'raw' => []]; }
				foreach(explode(";",trim($get['output']['this']['raw']['setHosts'],";")) as $ID){
					if(!isset($get['output']['details'][$get['output']['this']['raw']['setHostType']]['raw'][$ID])){
						$get['output']['details'][$get['output']['this']['raw']['setHostType']]['raw'][$ID] = $this->Auth->read($get['output']['this']['raw']['setHostType'],$ID)->all()[0];
						$get['output']['details'][$get['output']['this']['raw']['setHostType']]['dom'][$ID] = $this->convertToDOM($get['output']['details'][$get['output']['this']['raw']['setHostType']]['raw'][$ID]);
					}
				}
			}
			// Build Relations
			$get = $this->buildRelations($get);
			return $get;
		}
	}

	public function unlink($request = null, $data = null){
		if(isset($data)){
			if(!is_array($data)){ $data = json_decode($data, true); }
			$event = $this->Auth->read('events',$data['id']);
			if($event != null){
				$event = $event->all()[0];
				$event['setHosts'] = explode(";",trim($event['setHosts'],";"));
				$event['setPlanners'] = explode(";",trim($event['setPlanners'],";"));
				$event['setStaffs'] = explode(";",trim($event['setStaffs'],";"));
				$count = 0;
				if(in_array($data['relationship']['link_to'], $event['setHosts'])){ $count++; }
				if(in_array($data['relationship']['link_to'], $event['setPlanners'])){ $count++; }
				if(in_array($data['relationship']['link_to'], $event['setStaffs'])){ $count++; }
				if($count >= 1){
					switch($data['relationship']['relationship']){
						case"setHosts": if(in_array($data['relationship']['link_to'], $event['setHosts'])){ unset($event['setHosts'][array_search($data['relationship']['link_to'], $event['setHosts'])]); } break;
						case"setPlanners": if(in_array($data['relationship']['link_to'], $event['setPlanners'])){ unset($event['setPlanners'][array_search($data['relationship']['link_to'], $event['setPlanners'])]); } break;
						case"setStaffs": if(in_array($data['relationship']['link_to'], $event['setStaffs'])){ unset($event['setStaffs'][array_search($data['relationship']['link_to'], $event['setStaffs'])]); } break;
					}
					$event['setHosts'] = implode(";",$event['setHosts']);
					$event['setPlanners'] = implode(";",$event['setPlanners']);
					$event['setStaffs'] = implode(";",$event['setStaffs']);
					$this->Auth->update('events',$event,$event['id']);
					if($count <= 1){
						$relationships = $this->getRelationships($request,$data['id']);
						foreach($relationships as $id => $relationship){
							foreach($relationship as $relation){
								if(($relation['relationship'] == $data['relationship']['relationship'])&&($relation['link_to'] == $data['relationship']['link_to'])){
									$this->Auth->delete('relationships',$id);
								}
							}
						}
					}
					// Return
					return [
						"success" => $this->Language->Field["Record successfully updated"],
						"request" => $request,
						"data" => $data,
						"output" => [
							'relationship' => $data['relationship']['relationship'],
							'id' => $data['relationship']['link_to'],
						],
					];
				} else {
					// Return
					return [
						"error" => $this->Language->Field["Unable to complete the request"],
						"request" => $request,
						"data" => $data,
						"output" => [
							'relationship' => $data['relationship']['relationship'],
							'id' => $data['relationship']['link_to'],
						],
					];
				}
			} else {
				// Return
				return [
					"error" => $this->Language->Field["Unable to complete the request"],
					"request" => $request,
					"data" => $data,
					"output" => [
						'relationship' => $data['relationship']['relationship'],
						'id' => $data['relationship']['link_to'],
					],
				];
			}
		}
	}

	public function link($request = null, $data = null){
		if(isset($data)){
			if(!is_array($data)){ $data = json_decode($data, true); }
			$event = $this->Auth->read('events',$data['id']);
			if($event != null){
				$event = $event->all()[0];
				$event['setHosts'] = explode(";",trim($event['setHosts'],";"));
				$event['setPlanners'] = explode(";",trim($event['setPlanners'],";"));
				$event['setStaffs'] = explode(";",trim($event['setStaffs'],";"));
				switch($data['relationship']['relationship']){
					case"setHosts": if(!in_array($data['relationship']['link_to'], $event['setHosts'])){ array_push($event['setHosts'],$data['relationship']['link_to']); } break;
					case"setPlanners": if(!in_array($data['relationship']['link_to'], $event['setPlanners'])){ array_push($event['setPlanners'],$data['relationship']['link_to']); } break;
					case"setStaffs": if(!in_array($data['relationship']['link_to'], $event['setStaffs'])){ array_push($event['setStaffs'],$data['relationship']['link_to']); } break;
				}
				$event['setHosts'] = implode(";",$event['setHosts']);
				$event['setPlanners'] = implode(";",$event['setPlanners']);
				$event['setStaffs'] = implode(";",$event['setStaffs']);
				$this->Auth->update('events',$event,$event['id']);
				$relationship = [
					'relationship_1' => 'events',
					'link_to_1' => $event['id'],
					'link_to_2' => $data['relationship']['link_to'],
				];
				if($data['relationship']['relationship'] == 'host'){ $relationship['relationship_2'] = $event['setHostType']; }
				else { $relationship['relationship_2'] = 'users'; }
				$this->createRelationship($relationship);
				$relation['raw'] = $this->Auth->read($relationship['relationship_2'],$relationship['link_to_2'])->all()[0];
				$relation['dom'] = $this->convertToDOM($relation['raw']);
				// Return
				return [
					"success" => $this->Language->Field["Record successfully updated"],
					"request" => $request,
					"data" => $data,
					"output" => [
						'relationship' => $data['relationship']['relationship'],
						'id' => $data['relationship']['link_to'],
						'dom' => $relation['dom'],
						'raw' => $relation['raw'],
						'timeline' => [
							'relationship' => $data['relationship']['relationship'],
							'link_to' => $data['relationship']['link_to'],
							'created' => $relation['dom']['created'],
							'owner' => $relation['dom']['owner'],
						],
					],
				];
			} else {
				// Return
				return [
					"error" => $this->Language->Field["Unable to complete the request"],
					"request" => $request,
					"data" => $data,
					"output" => [
						'relationship' => $data['relationship']['relationship'],
						'id' => $data['relationship']['link_to'],
					],
				];
			}
		}
	}

	public function create($request = null, $data = null){
		if($data != null){
			if(!is_array($data)){ $data = json_decode($data, true); }
			if(!isset($data['key'])){ $data['key'] = 'id'; }
			if(isset($data['organization'])){ $data['name'] = $data['organization']; }
			if(isset($data['client'])){ $data['name'] = $data['client']; }
			if(isset($data['lead'])){ $data['name'] = $data['lead']; }
			if(isset($data['name'])){ $create = true; } else { $create = false; }
			// Lookup for an existing Entity
			if(isset($data['name']) && is_numeric($data['name'])){
				$organization = $this->Auth->read('events',$data['name']);
				if($organization != null){
					$organization = $organization->all()[0];
					$create = false;
				}
			}
			if($create){
				// Create Entity
				$result = $this->Auth->create('events',$this->convertToDB($data));
				// Fetch Entity
				$organization = $this->Auth->read('events',$result)->all()[0];
				// Init Subscriptions
				$subscriptions = [];
				// Init Subscribed
				$subscribed = [];
				// Init Sub-Categories
				$sub_category = [];
				// Init Messages
				$messages = [];
				// Init Users
				$users = [];
				// Fetch Category
				$issues = $this->Auth->query('SELECT * FROM `issues` WHERE `isDefault` = ?','true')->fetchAll();
				if($issues != null){ $issues = $issues->all(); } else { $issues = []; }
				// Fetch Category
				$category = $this->Auth->query('SELECT * FROM `categories` WHERE `name` = ? AND `relationship` = ?','events','subscriptions')->fetchAll()->all()[0];
				// Fetch Sub Categories
				$sub_categories = $this->Auth->query('SELECT * FROM `sub_categories` WHERE `relationship` = ?','subscriptions')->fetchAll()->all();
				foreach($sub_categories as $subs){
					$sub_category[$subs['name']] = $subs;
					// Fetch Subscriptions
					$list = $this->Auth->query('SELECT * FROM `subscriptions` WHERE `category` = ? AND `sub_category` = ?',$category['id'],$subs['id'])->fetchAll();
					if($list != null){
						$list = $list->all();
					} else { $list = []; }
					foreach($list as $subscription){ $subscriptions[$subs['name']][$subscription['relationship']][$subscription['link_to']] = $subscription; }
				}
				// Adding Issues
				foreach($this->Auth->read('statuses','1','order')->all() as $statuses){
					if($statuses['relationship'] == 'issues'){ $status = $statuses; }
				}
				foreach($issues as $issue){
					$this->createRelationship([
						'relationship_1' => 'events',
						'link_to_1' => $organization['id'],
						'relationship_2' => 'issues',
						'link_to_2' => $issue['id'],
						'relationship_3' => 'statuses',
						'link_to_3' => $status['id'],
					]);
				}
				// Create Status
				if(isset($data['status'])){
					foreach($this->Auth->read('statuses',$data['status'],'order')->all() as $statuses){
						if($statuses['relationship'] == 'events'){ $status = $statuses; }
					}
					$this->createRelationship([
						'relationship_1' => 'events',
						'link_to_1' => $organization['id'],
						'relationship_2' => 'statuses',
						'link_to_2' => $status['id'],
					]);
				}
				// Create Subscriptions
				foreach($subscriptions as $subscriptionType){
					foreach($subscriptionType as $type => $subscriptionArray){
						foreach($subscriptionArray as $subscription){
							if(!isset($subscribed[$subscription['relationship']])){ $subscribed[$subscription['relationship']] = []; }
							if(!in_array($subscription['link_to'], $subscribed[$subscription['relationship']])){
								array_push($subscribed[$subscription['relationship']], $subscription['link_to']);
								switch($subscription['relationship']){
									case"users":
										if(isset($users[$subscription['link_to']])){
											$this->createRelationship([
												'relationship_1' => 'events',
												'link_to_1' => $organization['id'],
												'relationship_2' => $subscription['relationship'],
												'link_to_2' => $subscription['link_to'],
											]);
										}
										break;
									default:
										$this->createRelationship([
											'relationship_1' => 'events',
											'link_to_1' => $organization['id'],
											'relationship_2' => $subscription['relationship'],
											'link_to_2' => $subscription['link_to'],
										]);
										break;
								}
							}
						}
					}
				}
				// Create Contact
				if(isset($data['first_name']) && !empty($data['first_name']) && $data['first_name'] != null){
					$contact = [
						'first_name' => $data['first_name'],
						'middle_name' => $data['middle_name'],
						'last_name' => $data['last_name'],
						'job_title' => $data['job_title'],
						'email' => $data['email'],
						'phone' => $data['phone'],
						'relationship' => 'events',
						'link_to' => $result,
					];
					if(class_exists('contactsAPI')){
						$contactsAPI = new contactsAPI();
						$contactsAPI->create('contacts',$contact);
					}
				}
				// Fetch Linked Entity
				if((isset($organization['organization']))&&($organization['organization'] != '')){
					$linkedEntity = $this->Auth->read('events',$organization['organization']);
					if($linkedEntity != null){
						$linkedEntity = $linkedEntity->all()[0];
						// Fetch Users
						if($linkedEntity['assigned_to'] != ''){
							foreach(explode(";",events['assigned_to']) as $userID){
								$user = $this->Auth->read('users',$userID);
								if($user != null){
									$user = $user->all()[0];
									$users[$user['id']] = $user;
								}
							}
						}
						// Create Linked Entity
						if('events' != 'events'){
							$this->createRelationship([
								'relationship_1' => 'events',
								'link_to_1' => $organization['id'],
								'relationship_2' => 'events',
								'link_to_2' => $linkedEntity['id'],
							]);
						}
					}
				}
				// Fetch Relationships
				$relationships = $this->getRelationships('events',$organization['id']);
				// Send Notifications
				if((isset($relationships))&&(!empty($relationships))){
					foreach($relationships as $id => $links){
						foreach($links as $relationship){
							// Fetch Contact Information
							unset($contact);
							if($relationship['relationship'] == "users"){ $contact = $this->Auth->read('users',$relationship['link_to'])->all()[0]; }
							if(isset($contact)){
								if(isset($subscriptions['new']['users'][$contact['id']])){
									// Send Internal Notifications
									if(isset($contact['username'])){
										parent::create('notifications',[
											'icon' => 'icon icon-organization mr-2',
											'subject' => 'You have a new organization',
											'dissmissed' => 1,
											'user' => $contact['id'],
											'href' => '?p='.'events'.'&v=details&id='.$organization[$data['key']],
										]);
									}
									// Send Mail Notifications
									if(isset($contact['email'])){
										$message = [
											'email' => $contact['email'],
											'message' => 'A new organization has been added.',
											'extra' => [
												'from' => $this->Auth->User['email'],
												'replyto' => $this->Settings['contacts']['events'],
												'subject' => "ALB Connect -"." ID:".$organization['id']." Entity:".$organization[$data['key']],
												'href' => '?p='.'events'.'&v=details&id='.$organization[$data['key']],
											],
										];
										$message['status'] = $this->Auth->Mail->send($message['email'],$message['message'],$message['extra']);
										$messages[$contact['email']] = $message;
									}
								}
							}
						}
					}
				}
			}
			if((isset($data['client']))||(isset($data['lead']))){
				// Init Entity
				$result = $organization['id'];
				if(isset($data['client'])){ $organization['isClient'] = 'true';$organization['isActive'] = 'true'; }
				if(isset($data['lead'])){ $organization['isLead'] = 'true';$organization['isActive'] = 'true'; }
				// Update Entity
				$this->Auth->update('events',$organization,$organization['id']);
			}
			// Return
			if(isset($organization)){
				$results = [
					"success" => $this->Language->Field["Record successfully created"],
					"request" => $request,
					"data" => $data,
					"output" => [
						'dom' => $this->convertToDOM($organization),
						'raw' => $organization,
					],
				];
			} else {
				$results = [
					"error" => $this->Language->Field["Unable to complete the request"],
					"request" => $request,
					"data" => $data,
				];
			}
		} else {
			if(isset($data['name'])){
				$results = [
					"error" => $this->Language->Field["Unable to complete the request"],
					"request" => $request,
					"data" => $data,
				];
			} else {
				$results = [
					"error" => $this->Language->Field["Unable to complete the request"].", no name provided.",
					"request" => $request,
					"data" => $data,
				];
			}
		}
		return $results;
	}
}
