#!/usr/bin/env python3
"""
Genshi Studio User Testing Launch Script
Launches and coordinates 100+ testing agents for comprehensive user simulation
"""

import asyncio
import json
import logging
import os
import sys
from datetime import datetime
from typing import Dict, List
import multiprocessing

# AI Creative Team System imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'src'))

from testing_coordinator import TestingCoordinator
from testing_agent_simulator import TestingAgentSimulator
from core.ai_team_logger import AITeamLogger

class UserTestingLauncher:
    def __init__(self):
        self.logger = AITeamLogger("UserTestingLauncher")
        self.coordinator = None
        self.agent_processes = []
        self.testing_active = False
        
    def load_agent_configurations(self) -> List[Dict]:
        """Load agent configurations from the testing plan"""
        plan_path = os.path.join(os.path.dirname(__file__), "user-testing-coordination-plan.json")
        
        with open(plan_path, 'r') as f:
            plan = json.load(f)["testing_coordination_plan"]
            
        agents = []
        
        # Generate agent configurations
        for category, category_data in plan["agent_distribution"]["categories"].items():
            personas = self.generate_personas_for_category(category, category_data["count"])
            
            for i in range(category_data["count"]):
                agent_config = {
                    "agent_id": f"{category.upper()}_{i+1:03d}",
                    "category": category,
                    "persona": personas[i % len(personas)],
                    "focus_areas": category_data["focus_areas"]
                }
                agents.append(agent_config)
                
        return agents
    
    def generate_personas_for_category(self, category: str, count: int) -> List[Dict]:
        """Generate personas for a specific category"""
        persona_templates = {
            "digital_artists": [
                {"name": "Maya", "experience": "professional", "tools": ["Photoshop", "Illustrator"], "focus": "commercial patterns"},
                {"name": "Alex", "experience": "hobbyist", "tools": ["GIMP", "Inkscape"], "focus": "personal projects"},
                {"name": "Jordan", "experience": "intermediate", "tools": ["Procreate", "Affinity"], "focus": "textile design"},
                {"name": "Sam", "experience": "beginner", "tools": ["Canva"], "focus": "social media graphics"},
                {"name": "Casey", "experience": "expert", "tools": ["Adobe Creative Suite"], "focus": "brand identity"},
                {"name": "Riley", "experience": "professional", "tools": ["Sketch", "Figma"], "focus": "digital patterns"},
                {"name": "Avery", "experience": "intermediate", "tools": ["Blender", "Inkscape"], "focus": "3D patterns"},
                {"name": "Phoenix", "experience": "advanced", "tools": ["Illustrator", "Photoshop"], "focus": "geometric art"},
            ],
            "web_developers": [
                {"name": "Chris", "experience": "senior", "languages": ["JavaScript", "Python"], "focus": "full-stack development"},
                {"name": "Taylor", "experience": "junior", "languages": ["HTML", "CSS", "JS"], "focus": "frontend development"},
                {"name": "Morgan", "experience": "intermediate", "languages": ["React", "Node.js"], "focus": "web applications"},
                {"name": "Riley", "experience": "expert", "languages": ["TypeScript", "Go"], "focus": "system architecture"},
                {"name": "Jamie", "experience": "senior", "languages": ["Vue.js", "Python"], "focus": "interactive applications"},
                {"name": "Dakota", "experience": "intermediate", "languages": ["Angular", "Java"], "focus": "enterprise applications"},
                {"name": "Sage", "experience": "junior", "languages": ["JavaScript", "PHP"], "focus": "web development"},
                {"name": "River", "experience": "advanced", "languages": ["React", "GraphQL"], "focus": "modern web apps"},
            ],
            "educators": [
                {"name": "Dr. Smith", "level": "university", "subject": "Computer Science", "focus": "algorithm visualization"},
                {"name": "Ms. Johnson", "level": "high_school", "subject": "Art", "focus": "digital art education"},
                {"name": "Prof. Lee", "level": "college", "subject": "Design", "focus": "pattern theory"},
                {"name": "Mr. Williams", "level": "middle_school", "subject": "Mathematics", "focus": "geometric concepts"},
                {"name": "Dr. Brown", "level": "university", "subject": "Art History", "focus": "cultural patterns"},
                {"name": "Ms. Davis", "level": "high_school", "subject": "Technology", "focus": "creative coding"},
                {"name": "Prof. Martinez", "level": "college", "subject": "Media Arts", "focus": "digital creativity"},
                {"name": "Mr. Wilson", "level": "elementary", "subject": "Art", "focus": "basic design principles"},
            ],
            "students": [
                {"name": "Emma", "level": "high_school", "interest": "digital art", "experience": "beginner"},
                {"name": "Liam", "level": "college", "interest": "web development", "experience": "intermediate"},
                {"name": "Sofia", "level": "university", "interest": "computer graphics", "experience": "advanced"},
                {"name": "Noah", "level": "middle_school", "interest": "coding", "experience": "beginner"},
                {"name": "Ava", "level": "high_school", "interest": "design", "experience": "intermediate"},
                {"name": "Mason", "level": "college", "interest": "game development", "experience": "advanced"},
                {"name": "Isabella", "level": "university", "interest": "mathematics", "experience": "expert"},
                {"name": "Lucas", "level": "high_school", "interest": "art", "experience": "intermediate"},
                {"name": "Mia", "level": "college", "interest": "pattern design", "experience": "beginner"},
                {"name": "Ethan", "level": "middle_school", "interest": "creative projects", "experience": "beginner"},
            ],
            "ux_ui_designers": [
                {"name": "Avery", "experience": "senior", "tools": ["Figma", "Sketch"], "focus": "user experience"},
                {"name": "Quinn", "experience": "mid-level", "tools": ["Adobe XD"], "focus": "visual design"},
                {"name": "Blake", "experience": "junior", "tools": ["Figma", "Principle"], "focus": "interaction design"},
                {"name": "Sage", "experience": "senior", "tools": ["Sketch", "InVision"], "focus": "design systems"},
                {"name": "Rowan", "experience": "intermediate", "tools": ["Adobe Creative Suite"], "focus": "brand design"},
                {"name": "Hayden", "experience": "advanced", "tools": ["Figma", "Framer"], "focus": "prototyping"},
            ],
            "cultural_researchers": [
                {"name": "Dr. Patel", "field": "anthropology", "focus": "geometric patterns in Islamic art"},
                {"name": "Prof. Wang", "field": "art history", "focus": "traditional Chinese patterns"},
                {"name": "Dr. Garcia", "field": "archaeology", "focus": "ancient Mesoamerican designs"},
                {"name": "Prof. Nakamura", "field": "cultural studies", "focus": "Japanese textile patterns"},
                {"name": "Dr. Okafor", "field": "ethnomusicology", "focus": "African rhythmic patterns"},
                {"name": "Prof. Andersen", "field": "folklore", "focus": "Nordic pattern traditions"},
                {"name": "Dr. Rossi", "field": "art history", "focus": "Renaissance geometric art"},
                {"name": "Prof. Hassan", "field": "cultural anthropology", "focus": "Middle Eastern designs"},
            ]
        }
        
        templates = persona_templates.get(category, [])
        
        # Generate enough personas by cycling through templates
        personas = []
        for i in range(count):
            template = templates[i % len(templates)]
            # Add variation to make each persona unique
            persona = template.copy()
            persona["variant_id"] = i // len(templates) + 1
            personas.append(persona)
            
        return personas

    async def launch_coordinator(self):
        """Launch the testing coordinator"""
        self.logger.info("Launching testing coordinator...")
        
        self.coordinator = TestingCoordinator()
        
        # Start coordinator in background
        coordinator_task = asyncio.create_task(self.coordinator.run_complete_testing_cycle())
        
        # Give coordinator time to initialize
        await asyncio.sleep(5)
        
        return coordinator_task

    async def launch_agents(self, agent_configs: List[Dict]):
        """Launch all testing agents"""
        self.logger.info(f"Launching {len(agent_configs)} testing agents...")
        
        # Launch agents in batches to avoid overwhelming the system
        batch_size = 20
        agent_tasks = []
        
        for i in range(0, len(agent_configs), batch_size):
            batch = agent_configs[i:i+batch_size]
            
            batch_tasks = []
            for config in batch:
                agent = TestingAgentSimulator(
                    agent_id=config["agent_id"],
                    category=config["category"],
                    persona=config["persona"]
                )
                
                task = asyncio.create_task(agent.run_agent_simulation())
                batch_tasks.append(task)
                
            agent_tasks.extend(batch_tasks)
            
            # Wait between batches
            await asyncio.sleep(2)
            
        self.logger.info(f"Successfully launched {len(agent_tasks)} testing agents")
        return agent_tasks

    async def monitor_testing_progress(self):
        """Monitor the testing progress"""
        self.logger.info("Starting testing progress monitoring...")
        
        while self.testing_active:
            try:
                if self.coordinator:
                    status = await self.coordinator.get_testing_status()
                    
                    self.logger.info(f"Testing Status: Phase={status['current_phase']}, "
                                   f"Agents={status['agents']['active']}/{status['agents']['total']}, "
                                   f"Scenarios={status['scenarios']['completed']}/{status['scenarios']['total']}")
                    
                    # Check if testing is complete
                    if status['current_phase'] == 'complete':
                        self.testing_active = False
                        break
                        
                await asyncio.sleep(30)  # Check every 30 seconds
                
            except Exception as e:
                self.logger.error(f"Error monitoring progress: {e}")
                await asyncio.sleep(30)

    async def run_complete_testing_session(self):
        """Run the complete testing session"""
        try:
            self.logger.info("Starting comprehensive user testing session for Genshi Studio")
            
            # Load agent configurations
            agent_configs = self.load_agent_configurations()
            self.logger.info(f"Loaded {len(agent_configs)} agent configurations")
            
            # Launch coordinator
            coordinator_task = await self.launch_coordinator()
            
            # Launch agents
            agent_tasks = await self.launch_agents(agent_configs)
            
            # Start monitoring
            self.testing_active = True
            monitor_task = asyncio.create_task(self.monitor_testing_progress())
            
            # Wait for completion
            await asyncio.gather(coordinator_task, monitor_task, *agent_tasks, return_exceptions=True)
            
            self.logger.info("User testing session completed successfully")
            
        except Exception as e:
            self.logger.error(f"Error in testing session: {e}")
            raise
        finally:
            self.testing_active = False

    async def generate_summary_report(self):
        """Generate a summary report of the testing session"""
        if not self.coordinator:
            self.logger.warning("No coordinator available for summary report")
            return
            
        try:
            status = await self.coordinator.get_testing_status()
            
            summary = {
                "session_summary": {
                    "total_agents": status["agents"]["total"],
                    "completed_agents": status["agents"]["completed"],
                    "success_rate": status["agents"]["completed"] / status["agents"]["total"] * 100,
                    "total_scenarios": status["scenarios"]["total"],
                    "completed_scenarios": status["scenarios"]["completed"],
                    "scenario_completion_rate": status["scenarios"]["completed"] / status["scenarios"]["total"] * 100,
                    "session_duration": status.get("session_duration", "N/A"),
                    "final_phase": status["current_phase"]
                },
                "key_findings": [
                    "User onboarding experience evaluation across diverse personas",
                    "Pattern creation workflow validation with different skill levels",
                    "Code-based generation testing with developer personas",
                    "Cross-platform compatibility assessment",
                    "Accessibility compliance verification",
                    "Educational feature effectiveness evaluation"
                ],
                "recommendations": [
                    "Analyze user feedback for common pain points",
                    "Review scenarios with low completion rates",
                    "Identify features that need improvement",
                    "Prioritize bug fixes based on severity and frequency",
                    "Enhance documentation for features with usability issues"
                ]
            }
            
            # Save summary report
            report_path = f"/Users/homeserver/ai-creative-team/projects/genshi-studio/testing/results/testing_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            os.makedirs(os.path.dirname(report_path), exist_ok=True)
            
            with open(report_path, 'w') as f:
                json.dump(summary, f, indent=2)
                
            self.logger.info(f"Summary report saved to {report_path}")
            
            return summary
            
        except Exception as e:
            self.logger.error(f"Error generating summary report: {e}")

def main():
    """Main function to launch user testing"""
    launcher = UserTestingLauncher()
    
    try:
        # Run the complete testing session
        asyncio.run(launcher.run_complete_testing_session())
        
        # Generate summary report
        asyncio.run(launcher.generate_summary_report())
        
        print("\n" + "="*80)
        print("🎉 GENSHI STUDIO USER TESTING SIMULATION COMPLETED!")
        print("="*80)
        print(f"📊 Results saved to: /Users/homeserver/ai-creative-team/projects/genshi-studio/testing/results/")
        print(f"📈 Check dashboard for real-time monitoring data")
        print(f"🔍 Review agent feedback and performance metrics")
        print(f"🚀 Use findings to improve Genshi Studio user experience")
        print("="*80)
        
    except KeyboardInterrupt:
        print("\n⚠️  User testing interrupted by user")
    except Exception as e:
        print(f"\n❌ Error in user testing: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()