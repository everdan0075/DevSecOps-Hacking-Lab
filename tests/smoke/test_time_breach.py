# TIME BREACH Feature - Smoke Tests
import pytest
import json
from pathlib import Path

EQUIFAX = Path(__file__).parent.parent.parent / 'frontend/src/data/missions/equifax-2017.json'
ACHIEVEMENTS = Path(__file__).parent.parent.parent / 'frontend/src/data/achievements.json'

class TestMissionDataIntegrity:
    def test_equifax_mission_exists(self):
        assert EQUIFAX.exists()
    
    def test_equifax_valid_json(self):
        with open(EQUIFAX, encoding='utf-8') as f:
            data = json.load(f)
        assert isinstance(data, dict)
        assert data["id"] == "equifax-2017"
    
    def test_mission_required_fields(self):
        with open(EQUIFAX, encoding='utf-8') as f:
            mission = json.load(f)
        required = ["id", "title", "timeline", "objectives", "evidence", "mitreTechniques"]
        for field in required:
            assert field in mission
    
    def test_timeline_phases(self):
        with open(EQUIFAX, encoding='utf-8') as f:
            mission = json.load(f)
        assert len(mission["timeline"]) >= 10
        for phase in mission["timeline"]:
            assert "id" in phase
            assert "date" in phase
            assert "type" in phase
            assert phase["type"] in ["discovery", "notification", "exploitation", "breach", "detection", "disclosure", "response"]
    
    def test_objectives_structure(self):
        with open(EQUIFAX, encoding='utf-8') as f:
            mission = json.load(f)
        assert len(mission["objectives"]) >= 6
        for obj in mission["objectives"]:
            assert "id" in obj
            assert "title" in obj
            assert "points" in obj
            assert obj["points"] > 0
            assert "role" in obj
    
    def test_mitre_techniques(self):
        with open(EQUIFAX, encoding='utf-8') as f:
            mission = json.load(f)
        assert len(mission["mitreTechniques"]) >= 5
        for tech in mission["mitreTechniques"]:
            assert "id" in tech
            assert tech["id"].startswith("T")
            assert "name" in tech
            assert "tactic" in tech
    
    def test_evidence_artifacts(self):
        with open(EQUIFAX, encoding='utf-8') as f:
            mission = json.load(f)
        assert len(mission["evidence"]) >= 5
        valid_types = ["document", "log", "code", "network", "email", "database"]
        for evidence in mission["evidence"]:
            assert evidence["type"] in valid_types
    
    def test_multiple_endings(self):
        with open(EQUIFAX, encoding='utf-8') as f:
            mission = json.load(f)
        assert len(mission["endings"]) >= 3
        ending_types = [e["type"] for e in mission["endings"]]
        assert "success" in ending_types or "prevented" in ending_types

class TestAchievementSystem:
    def test_achievements_file_exists(self):
        assert ACHIEVEMENTS.exists()
    
    def test_achievements_valid_json(self):
        with open(ACHIEVEMENTS, encoding='utf-8') as f:
            data = json.load(f)
        assert isinstance(data, list)
        assert len(data) > 0
    
    def test_achievement_structure(self):
        with open(ACHIEVEMENTS, encoding='utf-8') as f:
            achievements = json.load(f)
        required = ["id", "title", "description", "category", "tier", "points"]
        for ach in achievements:
            for field in required:
                assert field in ach
    
    def test_achievement_categories(self):
        with open(ACHIEVEMENTS, encoding='utf-8') as f:
            achievements = json.load(f)
        valid = ["technique", "mission", "role", "special", "speedrun"]
        for ach in achievements:
            assert ach["category"] in valid
    
    def test_achievement_tiers(self):
        with open(ACHIEVEMENTS, encoding='utf-8') as f:
            achievements = json.load(f)
        valid = ["bronze", "silver", "gold", "platinum"]
        for ach in achievements:
            assert ach["tier"] in valid
    
    def test_mitre_technique_achievements(self):
        with open(ACHIEVEMENTS, encoding='utf-8') as f:
            achievements = json.load(f)
        tech_achs = [a for a in achievements if a["category"] == "technique"]
        assert len(tech_achs) >= 5

class TestIntegration:
    def test_mission_to_achievement_mapping(self):
        with open(EQUIFAX, encoding='utf-8') as f:
            mission = json.load(f)
        with open(ACHIEVEMENTS, encoding='utf-8') as f:
            achievements = json.load(f)
        equifax_achs = [a for a in achievements 
                        if a["condition"]["type"] == "mission_complete" 
                        and a["condition"].get("value") == "equifax-2017"]
        assert len(equifax_achs) > 0
    
    def test_mitre_consistency(self):
        with open(EQUIFAX, encoding='utf-8') as f:
            mission = json.load(f)
        with open(ACHIEVEMENTS, encoding='utf-8') as f:
            achievements = json.load(f)
        mission_techniques = set(t["id"] for t in mission["mitreTechniques"])
        tech_achs = [a for a in achievements 
                     if a["condition"]["type"] == "mitre_technique"
                     and isinstance(a["condition"].get("value"), str)
                     and a["condition"]["value"].startswith("T")]
        ach_techniques = set(a["condition"]["value"] for a in tech_achs)
        overlap = mission_techniques & ach_techniques
        assert len(overlap) >= 3

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
