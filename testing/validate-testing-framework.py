#!/usr/bin/env python3
"""
Genshi Studio Testing Framework Validation
Validates the testing framework setup and configuration
"""

import asyncio
import json
import os
import sys
from datetime import datetime
from typing import Dict, List, Optional

# Simple logger for validation
class SimpleLogger:
    def __init__(self, name):
        self.name = name
    
    def info(self, msg):
        print(f"[INFO] {self.name}: {msg}")
    
    def error(self, msg):
        print(f"[ERROR] {self.name}: {msg}")
        
    def debug(self, msg):
        print(f"[DEBUG] {self.name}: {msg}")

class TestingFrameworkValidator:
    def __init__(self):
        self.logger = SimpleLogger("TestingFrameworkValidator")
        self.validation_results = {
            "timestamp": datetime.now().isoformat(),
            "framework_status": "unknown",
            "components_validated": [],
            "validation_errors": [],
            "recommendations": []
        }
    
    def validate_file_structure(self) -> bool:
        """Validate the testing framework file structure"""
        required_files = [
            "user-testing-coordination-plan.json",
            "testing-coordinator.py",
            "testing-agent-simulator.py",
            "launch-user-testing.py"
        ]
        
        missing_files = []
        base_path = os.path.dirname(__file__)
        
        for file in required_files:
            file_path = os.path.join(base_path, file)
            if not os.path.exists(file_path):
                missing_files.append(file)
        
        if missing_files:
            self.validation_results["validation_errors"].append(
                f"Missing required files: {', '.join(missing_files)}"
            )
            return False
        
        self.validation_results["components_validated"].append("File structure")
        return True
    
    def validate_coordination_plan(self) -> bool:
        """Validate the coordination plan configuration"""
        try:
            plan_path = os.path.join(os.path.dirname(__file__), "user-testing-coordination-plan.json")
            
            with open(plan_path, 'r') as f:
                plan = json.load(f)
            
            # Validate structure
            required_sections = [
                "agent_distribution",
                "testing_scenarios",
                "timeline",
                "communication_protocols"
            ]
            
            plan_data = plan.get("testing_coordination_plan", {})
            
            for section in required_sections:
                if section not in plan_data:
                    self.validation_results["validation_errors"].append(
                        f"Missing required section in coordination plan: {section}"
                    )
                    return False
            
            # Validate agent distribution
            agent_dist = plan_data.get("agent_distribution", {})
            total_agents = agent_dist.get("total_agents", 0)
            categories = agent_dist.get("categories", {})
            
            calculated_total = sum(cat.get("count", 0) for cat in categories.values())
            
            if total_agents != calculated_total:
                self.validation_results["validation_errors"].append(
                    f"Agent count mismatch: declared {total_agents}, calculated {calculated_total}"
                )
                return False
            
            # Validate scenarios
            scenarios = plan_data.get("testing_scenarios", {})
            if len(scenarios) < 5:
                self.validation_results["validation_errors"].append(
                    "Insufficient testing scenarios (minimum 5 required)"
                )
                return False
            
            self.validation_results["components_validated"].append("Coordination plan")
            return True
            
        except Exception as e:
            self.validation_results["validation_errors"].append(
                f"Error validating coordination plan: {str(e)}"
            )
            return False
    
    def validate_python_syntax(self) -> bool:
        """Validate Python syntax in all scripts"""
        python_files = [
            "testing-coordinator.py",
            "testing-agent-simulator.py",
            "launch-user-testing.py"
        ]
        
        base_path = os.path.dirname(__file__)
        syntax_errors = []
        
        for file in python_files:
            file_path = os.path.join(base_path, file)
            try:
                with open(file_path, 'r') as f:
                    source = f.read()
                compile(source, file_path, 'exec')
            except SyntaxError as e:
                syntax_errors.append(f"{file}: {str(e)}")
            except Exception as e:
                syntax_errors.append(f"{file}: {str(e)}")
        
        if syntax_errors:
            self.validation_results["validation_errors"].extend(syntax_errors)
            return False
        
        self.validation_results["components_validated"].append("Python syntax")
        return True
    
    def validate_agent_personas(self) -> bool:
        """Validate agent persona configurations"""
        try:
            plan_path = os.path.join(os.path.dirname(__file__), "user-testing-coordination-plan.json")
            
            with open(plan_path, 'r') as f:
                plan = json.load(f)["testing_coordination_plan"]
            
            categories = plan["agent_distribution"]["categories"]
            
            # Check persona diversity
            for category, data in categories.items():
                count = data.get("count", 0)
                if count > 10:  # Categories with many agents need persona diversity
                    focus_areas = data.get("focus_areas", [])
                    if len(focus_areas) < 3:
                        self.validation_results["validation_errors"].append(
                            f"Category {category} needs more focus area diversity (minimum 3)"
                        )
                        return False
            
            self.validation_results["components_validated"].append("Agent personas")
            return True
            
        except Exception as e:
            self.validation_results["validation_errors"].append(
                f"Error validating agent personas: {str(e)}"
            )
            return False
    
    def validate_testing_scenarios(self) -> bool:
        """Validate testing scenario configurations"""
        try:
            plan_path = os.path.join(os.path.dirname(__file__), "user-testing-coordination-plan.json")
            
            with open(plan_path, 'r') as f:
                plan = json.load(f)["testing_coordination_plan"]
            
            scenarios = plan["testing_scenarios"]
            
            # Validate scenario coverage
            covered_areas = set()
            for scenario_data in scenarios.values():
                scenario_name = scenario_data.get("name", "").lower()
                if "onboarding" in scenario_name or "first-time" in scenario_name:
                    covered_areas.add("onboarding")
                elif "pattern" in scenario_name and "creation" in scenario_name:
                    covered_areas.add("pattern_creation")
                elif "code" in scenario_name:
                    covered_areas.add("code_generation")
                elif "export" in scenario_name:
                    covered_areas.add("export_functionality")
                elif "accessibility" in scenario_name:
                    covered_areas.add("accessibility")
                elif "cross-platform" in scenario_name or "browser" in scenario_name:
                    covered_areas.add("cross_platform")
                elif "educational" in scenario_name:
                    covered_areas.add("educational")
            
            required_areas = {
                "onboarding", "pattern_creation", "code_generation", 
                "export_functionality", "accessibility", "cross_platform"
            }
            
            missing_areas = required_areas - covered_areas
            if missing_areas:
                self.validation_results["validation_errors"].append(
                    f"Missing required testing areas: {', '.join(missing_areas)}"
                )
                return False
            
            self.validation_results["components_validated"].append("Testing scenarios")
            return True
            
        except Exception as e:
            self.validation_results["validation_errors"].append(
                f"Error validating testing scenarios: {str(e)}"
            )
            return False
    
    def validate_communication_protocols(self) -> bool:
        """Validate communication protocol configurations"""
        try:
            plan_path = os.path.join(os.path.dirname(__file__), "user-testing-coordination-plan.json")
            
            with open(plan_path, 'r') as f:
                plan = json.load(f)["testing_coordination_plan"]
            
            comm_protocols = plan.get("communication_protocols", {})
            
            # Validate message types
            required_message_types = [
                "TASK_ASSIGNMENT", "STATUS_UPDATE", "ISSUE_REPORT", 
                "KNOWLEDGE_SHARE", "HELP_REQUEST"
            ]
            
            message_types = comm_protocols.get("message_types", {})
            
            for msg_type in required_message_types:
                if msg_type not in message_types:
                    self.validation_results["validation_errors"].append(
                        f"Missing required message type: {msg_type}"
                    )
                    return False
            
            self.validation_results["components_validated"].append("Communication protocols")
            return True
            
        except Exception as e:
            self.validation_results["validation_errors"].append(
                f"Error validating communication protocols: {str(e)}"
            )
            return False
    
    def validate_data_collection(self) -> bool:
        """Validate data collection configuration"""
        try:
            plan_path = os.path.join(os.path.dirname(__file__), "user-testing-coordination-plan.json")
            
            with open(plan_path, 'r') as f:
                plan = json.load(f)["testing_coordination_plan"]
            
            data_collection = plan.get("data_collection", {})
            
            # Validate metrics
            metrics = data_collection.get("metrics", {})
            if not metrics.get("quantitative") or not metrics.get("qualitative"):
                self.validation_results["validation_errors"].append(
                    "Missing quantitative or qualitative metrics configuration"
                )
                return False
            
            # Validate collection methods
            methods = data_collection.get("collection_methods", {})
            if not methods.get("automated") or not methods.get("agent_reported"):
                self.validation_results["validation_errors"].append(
                    "Missing automated or agent-reported collection methods"
                )
                return False
            
            self.validation_results["components_validated"].append("Data collection")
            return True
            
        except Exception as e:
            self.validation_results["validation_errors"].append(
                f"Error validating data collection: {str(e)}"
            )
            return False
    
    def validate_timeline_feasibility(self) -> bool:
        """Validate timeline feasibility"""
        try:
            plan_path = os.path.join(os.path.dirname(__file__), "user-testing-coordination-plan.json")
            
            with open(plan_path, 'r') as f:
                plan = json.load(f)["testing_coordination_plan"]
            
            timeline = plan.get("timeline", {})
            
            # Calculate total estimated time
            total_hours = 0
            for phase_name, phase_data in timeline.items():
                if isinstance(phase_data, dict) and "duration" in phase_data:
                    duration_str = phase_data["duration"]
                    if "hours" in duration_str:
                        hours = int(duration_str.split()[0])
                        total_hours += hours
            
            # Validate reasonable timeline (should be 8-16 hours total)
            if total_hours < 8 or total_hours > 20:
                self.validation_results["validation_errors"].append(
                    f"Timeline appears unrealistic: {total_hours} hours total"
                )
                return False
            
            self.validation_results["components_validated"].append("Timeline feasibility")
            return True
            
        except Exception as e:
            self.validation_results["validation_errors"].append(
                f"Error validating timeline: {str(e)}"
            )
            return False
    
    def validate_results_directory(self) -> bool:
        """Validate and create results directory"""
        try:
            results_dir = os.path.join(os.path.dirname(__file__), "results")
            
            if not os.path.exists(results_dir):
                os.makedirs(results_dir)
                self.logger.info(f"Created results directory: {results_dir}")
            
            # Check write permissions
            test_file = os.path.join(results_dir, "test_write.tmp")
            try:
                with open(test_file, 'w') as f:
                    f.write("test")
                os.remove(test_file)
            except Exception as e:
                self.validation_results["validation_errors"].append(
                    f"Cannot write to results directory: {str(e)}"
                )
                return False
            
            self.validation_results["components_validated"].append("Results directory")
            return True
            
        except Exception as e:
            self.validation_results["validation_errors"].append(
                f"Error validating results directory: {str(e)}"
            )
            return False
    
    def generate_recommendations(self):
        """Generate recommendations based on validation results"""
        recommendations = []
        
        if len(self.validation_results["validation_errors"]) == 0:
            recommendations.append("✅ Framework is ready for testing execution")
            recommendations.append("🚀 Run 'python launch-user-testing.py' to start testing")
        else:
            recommendations.append("⚠️ Fix validation errors before running tests")
            recommendations.append("🔧 Review configuration files and fix issues")
        
        recommendations.append("📊 Monitor testing progress through dashboard")
        recommendations.append("📈 Review results in testing/results/ directory")
        recommendations.append("🔍 Analyze agent feedback for improvement opportunities")
        
        self.validation_results["recommendations"] = recommendations
    
    def run_complete_validation(self) -> Dict:
        """Run complete validation of the testing framework"""
        self.logger.info("Starting testing framework validation...")
        
        validation_checks = [
            ("File structure", self.validate_file_structure),
            ("Coordination plan", self.validate_coordination_plan),
            ("Python syntax", self.validate_python_syntax),
            ("Agent personas", self.validate_agent_personas),
            ("Testing scenarios", self.validate_testing_scenarios),
            ("Communication protocols", self.validate_communication_protocols),
            ("Data collection", self.validate_data_collection),
            ("Timeline feasibility", self.validate_timeline_feasibility),
            ("Results directory", self.validate_results_directory),
        ]
        
        all_valid = True
        
        for check_name, check_func in validation_checks:
            self.logger.info(f"Validating {check_name}...")
            try:
                result = check_func()
                if result:
                    self.logger.info(f"✅ {check_name} validation passed")
                else:
                    self.logger.error(f"❌ {check_name} validation failed")
                    all_valid = False
            except Exception as e:
                self.logger.error(f"❌ {check_name} validation error: {str(e)}")
                self.validation_results["validation_errors"].append(
                    f"{check_name}: {str(e)}"
                )
                all_valid = False
        
        # Set overall status
        self.validation_results["framework_status"] = "valid" if all_valid else "invalid"
        
        # Generate recommendations
        self.generate_recommendations()
        
        # Save validation report
        report_path = os.path.join(
            os.path.dirname(__file__), 
            "results", 
            f"validation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        )
        
        os.makedirs(os.path.dirname(report_path), exist_ok=True)
        
        with open(report_path, 'w') as f:
            json.dump(self.validation_results, f, indent=2)
        
        self.logger.info(f"Validation report saved to: {report_path}")
        
        return self.validation_results
    
    def print_validation_summary(self):
        """Print validation summary to console"""
        status = self.validation_results["framework_status"]
        
        print("\n" + "="*80)
        print("🧪 GENSHI STUDIO TESTING FRAMEWORK VALIDATION SUMMARY")
        print("="*80)
        
        if status == "valid":
            print("✅ FRAMEWORK STATUS: VALID - Ready for testing execution")
        else:
            print("❌ FRAMEWORK STATUS: INVALID - Requires fixes before testing")
        
        print(f"\n📋 Components Validated: {len(self.validation_results['components_validated'])}")
        for component in self.validation_results['components_validated']:
            print(f"   ✅ {component}")
        
        if self.validation_results['validation_errors']:
            print(f"\n❌ Validation Errors: {len(self.validation_results['validation_errors'])}")
            for error in self.validation_results['validation_errors']:
                print(f"   ❌ {error}")
        
        print(f"\n💡 Recommendations:")
        for rec in self.validation_results['recommendations']:
            print(f"   {rec}")
        
        print("="*80)

def main():
    """Main validation function"""
    validator = TestingFrameworkValidator()
    
    try:
        # Run complete validation
        results = validator.run_complete_validation()
        
        # Print summary
        validator.print_validation_summary()
        
        # Return appropriate exit code
        if results["framework_status"] == "valid":
            return 0
        else:
            return 1
            
    except Exception as e:
        print(f"❌ Validation failed with error: {str(e)}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)