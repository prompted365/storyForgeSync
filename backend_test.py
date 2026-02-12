import requests
import sys
import json
from datetime import datetime

class StoryForgeAPITester:
    def __init__(self, base_url="https://workspace-optimizer-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.project_id = None
        self.world_id = None
        self.char_id = None
        self.scene_id = None
        self.shot_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            elif method == 'PATCH':
                response = requests.patch(url, headers=headers, params=params)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.text else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        if success:
            required_fields = ['project_count', 'total_shots', 'total_worlds', 'total_characters', 'stage_counts', 'total_duration_sec']
            for field in required_fields:
                if field not in response:
                    print(f"   ⚠️  Missing field: {field}")
                    return False
            print(f"   📊 Stats: {response.get('project_count', 0)} projects, {response.get('total_shots', 0)} shots")
        return success

    def test_get_enums(self):
        """Test enums endpoint"""
        success, response = self.run_test(
            "Get Enums",
            "GET",
            "enums",
            200
        )
        if success:
            expected_enums = ['production_stages', 'emotional_zones', 'framings', 'camera_movements']
            for enum_type in expected_enums:
                if enum_type not in response:
                    print(f"   ⚠️  Missing enum: {enum_type}")
                    return False
            print(f"   📋 Enums loaded: {len(response.get('production_stages', []))} stages")
        return success

    def test_seed_example_project(self):
        """Test seeding example project"""
        success, response = self.run_test(
            "Seed Example Project",
            "POST",
            "seed/example",
            200
        )
        if success and 'project_id' in response:
            self.project_id = response['project_id']
            print(f"   🌱 Example project seeded: {self.project_id}")
            print(f"   📈 Created: {response.get('worlds', 0)} worlds, {response.get('characters', 0)} characters, {response.get('shots', 0)} shots")
        return success

    def test_list_projects(self):
        """Test listing projects"""
        success, response = self.run_test(
            "List Projects",
            "GET",
            "projects",
            200
        )
        if success and response:
            # Find Mito project and verify it has expected data
            mito_project = None
            for project in response:
                if "Mito" in project.get('name', ''):
                    mito_project = project
                    break
            
            if mito_project:
                print(f"   🎬 Found Mito project with {mito_project.get('world_count', 0)} worlds, {mito_project.get('character_count', 0)} chars, {mito_project.get('shot_count', 0)} shots")
                # Verify expected Mito project data
                if (mito_project.get('world_count') == 5 and 
                    mito_project.get('character_count') == 2 and 
                    mito_project.get('shot_count') == 15):
                    print("   ✅ Mito project has correct counts")
                else:
                    print(f"   ⚠️  Mito project counts incorrect - expected: 5 worlds, 2 chars, 15 shots")
            else:
                print("   ⚠️  Mito project not found")
        return success

    def test_get_project(self):
        """Test getting specific project details"""
        if not self.project_id:
            return False
            
        success, response = self.run_test(
            "Get Project Details",
            "GET",
            f"projects/{self.project_id}",
            200
        )
        if success:
            print(f"   📋 Project: {response.get('name', 'Unknown')}")
            print(f"   🎯 Completion: {response.get('completion_pct', 0)}%")
            if 'stage_counts' in response:
                concept_count = response['stage_counts'].get('concept', 0)
                print(f"   📊 Stage counts: {concept_count} in concept stage")
        return success

    def test_worlds_api(self):
        """Test worlds CRUD operations"""
        if not self.project_id:
            return False

        # List worlds
        success, worlds = self.run_test(
            "List Worlds",
            "GET",
            f"projects/{self.project_id}/worlds",
            200
        )
        if success and worlds:
            print(f"   🌍 Found {len(worlds)} worlds")
            for world in worlds[:2]:  # Show first 2
                print(f"     - {world.get('name', 'Unknown')} ({world.get('emotional_zone', 'N/A')})")
            self.world_id = worlds[0]['id'] if worlds else None
        return success

    def test_characters_api(self):
        """Test characters API"""
        if not self.project_id:
            return False

        # List characters
        success, chars = self.run_test(
            "List Characters",
            "GET", 
            f"projects/{self.project_id}/characters",
            200
        )
        if success and chars:
            print(f"   👥 Found {len(chars)} characters")
            for char in chars:
                print(f"     - {char.get('name', 'Unknown')} ({char.get('role', 'N/A')})")
            self.char_id = chars[0]['id'] if chars else None
        return success

    def test_scenes_api(self):
        """Test scenes API"""
        if not self.project_id:
            return False

        # List scenes
        success, scenes = self.run_test(
            "List Scenes",
            "GET",
            f"projects/{self.project_id}/scenes", 
            200
        )
        if success and scenes:
            print(f"   🎬 Found {len(scenes)} scenes")
            for scene in scenes[:3]:  # Show first 3
                print(f"     - Scene {scene.get('scene_number', 0)}: {scene.get('title', 'Unknown')} ({scene.get('emotional_zone', 'N/A')})")
            self.scene_id = scenes[0]['id'] if scenes else None
        return success

    def test_shots_api(self):
        """Test shots API"""
        if not self.project_id:
            return False

        # List all shots
        success, shots = self.run_test(
            "List Shots",
            "GET",
            f"projects/{self.project_id}/shots",
            200
        )
        if success and shots:
            print(f"   🎯 Found {len(shots)} shots")
            concept_shots = [s for s in shots if s.get('production_status') == 'concept']
            print(f"   📊 {len(concept_shots)} shots in concept stage")
            self.shot_id = shots[0]['id'] if shots else None
        return success

    def test_shot_status_update(self):
        """Test updating shot status"""
        if not self.project_id or not self.shot_id:
            return False

        # Try to advance a shot to next stage
        success, response = self.run_test(
            "Update Shot Status",
            "PATCH",
            f"projects/{self.project_id}/shots/{self.shot_id}/status",
            200,
            params={'status': 'world_built'}
        )
        if success:
            print(f"   🔄 Shot status updated successfully")
        return success

    def test_ai_compiler(self):
        """Test AI compilation endpoint"""
        if not self.project_id:
            return False

        compile_data = {
            "project_id": self.project_id,
            "scene_description": "Test scene: Mito glows dimly in a cellular wasteland",
            "world_id": self.world_id,
            "character_ids": [self.char_id] if self.char_id else [],
            "emotional_zone": "desolate",
            "framing": "medium",
            "camera_movement": "static"
        }

        print("   ⚠️  Starting AI compilation test (may take 10-30 seconds)...")
        success, response = self.run_test(
            "AI Scene Compilation",
            "POST",
            f"projects/{self.project_id}/compile",
            200,
            data=compile_data
        )
        
        if success:
            if 'result' in response and 'image_prompt' in response.get('result', {}):
                print(f"   🤖 AI compilation successful")
                image_prompt = response['result'].get('image_prompt', '')
                print(f"   📝 Image prompt preview: {image_prompt[:100]}...")
            else:
                print(f"   ⚠️  AI compilation returned unexpected format")
                print(f"   📄 Response: {json.dumps(response, indent=2)[:300]}...")
        return success

    def test_shot_reorder(self):
        """Test shot reorder endpoint"""
        if not self.project_id:
            return False

        # Get current shots first
        success, shots = self.run_test(
            "Get Shots for Reorder",
            "GET",
            f"projects/{self.project_id}/shots",
            200
        )
        
        if not success or not shots:
            print("   ⚠️  No shots found for reorder test")
            return False

        # Get first 3 shot IDs and reverse their order
        shot_ids = [s['id'] for s in shots[:3]]
        reversed_ids = shot_ids[::-1]
        
        success, response = self.run_test(
            "Reorder Shots",
            "POST",
            f"projects/{self.project_id}/shots/reorder",
            200,
            data={"shot_ids": reversed_ids}
        )
        
        if success:
            print(f"   🔄 Reordered {response.get('count', 0)} shots")
        return success

    def test_batch_compile(self):
        """Test batch compile endpoint"""
        if not self.project_id:
            return False

        # Get first 2 shot IDs
        success, shots = self.run_test(
            "Get Shots for Batch Compile",
            "GET",
            f"projects/{self.project_id}/shots",
            200
        )
        
        if not success or len(shots) < 2:
            print("   ⚠️  Need at least 2 shots for batch compile test")
            return False

        shot_ids = [shots[0]['id'], shots[1]['id']]
        
        print("   ⚠️  Starting batch compile test (may take 30+ seconds)...")
        success, response = self.run_test(
            "Batch Compile",
            "POST",
            f"projects/{self.project_id}/batch-compile",
            200,
            data={"shot_ids": shot_ids}
        )
        
        if success:
            results = response.get('results', [])
            successful = len([r for r in results if not r.get('error')])
            print(f"   🎬 Batch compiled {successful}/{len(results)} shots successfully")
        return success

    def test_notion_push(self):
        """Test notion push endpoint"""
        if not self.project_id:
            return False

        success, response = self.run_test(
            "Notion Push",
            "POST",
            f"projects/{self.project_id}/notion/push",
            200
        )
        
        if success:
            rows = response.get('rows', [])
            schema = response.get('notion_db_schema', {})
            print(f"   📊 Prepared {len(rows)} rows for Notion with {len(schema)} schema fields")
            # Show sample row data
            if rows:
                sample_row = rows[0]
                print(f"   📄 Sample: Shot #{sample_row.get('shot_number')}, Status: {sample_row.get('status')}")
        return success

    def test_describe_image(self):
        """Test AI describe image endpoint"""
        if not self.project_id:
            return False

        describe_data = {
            "image_url": "https://via.placeholder.com/400x300/00ff00/ffffff?text=Test+World",
            "entity_type": "world",
            "additional_context": "Testing AI image description"
        }

        print("   ⚠️  Starting AI image describe test (may take 10-20 seconds)...")
        success, response = self.run_test(
            "AI Describe Image",
            "POST",
            f"projects/{self.project_id}/describe-image",
            200,
            data=describe_data
        )
        
        if success:
            result = response.get('result', {})
            if 'name' in result:
                print(f"   🤖 AI description successful: {result.get('name', 'N/A')}")
            else:
                print(f"   ⚠️  AI description returned unexpected format")
        return success

def main():
    """Main test execution"""
    print("🚀 Starting StoryForge Backend API Testing")
    print("=" * 60)
    
    tester = StoryForgeAPITester()
    
    # Core API tests
    tests = [
        ("Dashboard Stats", tester.test_dashboard_stats),
        ("Enums", tester.test_get_enums),
        ("Seed Example Project", tester.test_seed_example_project),
        ("List Projects", tester.test_list_projects),
        ("Get Project Details", tester.test_get_project),
        ("Worlds API", tester.test_worlds_api), 
        ("Characters API", tester.test_characters_api),
        ("Scenes API", tester.test_scenes_api),
        ("Shots API", tester.test_shots_api),
        ("Shot Status Update", tester.test_shot_status_update),
        ("Shot Reorder", tester.test_shot_reorder),
        ("Batch Compile", tester.test_batch_compile),
        ("Notion Push", tester.test_notion_push),
        ("AI Describe Image", tester.test_describe_image),
        ("AI Compiler", tester.test_ai_compiler),
    ]
    
    print(f"\n📋 Running {len(tests)} test groups...")
    
    failed_tests = []
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} crashed: {str(e)}")
            failed_tests.append(test_name)

    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 BACKEND TEST RESULTS")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0:.1f}%")
    
    if failed_tests:
        print(f"\n❌ Failed test groups:")
        for test in failed_tests:
            print(f"   - {test}")
    else:
        print(f"\n✅ All test groups passed!")
        
    return 0 if len(failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())