import unittest
from validator import validate_data
from analysis import analyze_data

class TestCoastalErosion(unittest.TestCase):
    def setUp(self):
        self.valid_data = [
            {
                "village_id": "V1",
                "village_name": "Test1",
                "district": "D1",
                "state": "Odisha",
                "latitude": 20.0,
                "longitude": 86.0,
                "hazard_type": "Coastal Erosion",
                "erosion_area_sq_m": 1000.0,
                "trend": "Erosion",
                "risk_level": "High",
                "risk_score_suggested": 80,
                "context": "Context",
                "mitigation_status": "None",
                "data_year": 2023,
                "source": "NCCR",
                "source_url": "url"
            }
        ]
        
        self.invalid_data = [
            {
                "village_id": "V2",
                "village_name": "Test2",
                "district": "D1",
                "state": "Odisha",
                "latitude": 200.0, # invalid
                "longitude": 86.0,
                "hazard_type": "Coastal Erosion",
                "erosion_area_sq_m": -100.0, # invalid
                "trend": "Erosion",
                "risk_level": "High",
                "risk_score_suggested": 80,
                "context": "Context",
                "mitigation_status": "None",
                "data_year": 2023,
                "source": "NCCR",
                "source_url": "url"
            }
        ]

    def test_validator_valid(self):
        is_valid, errs = validate_data(self.valid_data)
        self.assertTrue(is_valid)
        self.assertEqual(len(errs), 0)
        
    def test_validator_invalid(self):
        is_valid, errs = validate_data(self.invalid_data)
        self.assertFalse(is_valid)
        self.assertTrue(any("Invalid latitude" in err for err in errs))
        self.assertTrue(any("negative" in err for err in errs))

    def test_analysis(self):
        stats = analyze_data(self.valid_data)
        self.assertEqual(stats["total_locations"], 1)
        self.assertEqual(stats["erosion_locations"], 1)
        self.assertEqual(stats["total_erosion_area"], 1000.0)

if __name__ == '__main__':
    unittest.main()
