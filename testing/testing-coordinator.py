#!/usr/bin/env python3
"""
Genshi Studio User Testing Coordinator
Manages 100+ agent testing simulation for comprehensive user experience validation
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set
from dataclasses import dataclass, asdict
from enum import Enum
import uuid

# AI Creative Team System imports
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'src'))

from core.agent_communication_hub import CommunicationHub, MessageType
from core.ai_team_knowledge_base import KnowledgeBase
from core.ai_team_logger import AITeamLogger

class TestPhase(Enum):
    SETUP = "setup"
    ONBOARDING = "onboarding"
    CORE_FEATURES = "core_features"
    SPECIALIZED = "specialized"
    EDGE_CASES = "edge_cases"
    ANALYSIS = "analysis"
    COMPLETE = "complete"

class AgentStatus(Enum):
    REGISTERED = "registered"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ERROR = "error"

@dataclass
class TestingAgent:
    agent_id: str
    category: str
    persona: Dict
    status: AgentStatus
    current_scenario: Optional[str] = None
    completed_scenarios: List[str] = None
    last_update: datetime = None
    metrics: Dict = None
    
    def __post_init__(self):
        if self.completed_scenarios is None:
            self.completed_scenarios = []
        if self.metrics is None:
            self.metrics = {}
        if self.last_update is None:
            self.last_update = datetime.now()

@dataclass
class TestingScenario:
    scenario_id: str
    name: str
    duration_minutes: int
    tasks: List[str]
    assigned_agents: List[str]
    status: str = "pending"
    start_time: Optional[datetime] = None
    completion_rate: float = 0.0

class TestingCoordinator:
    def __init__(self):
        self.coordinator_id = "COORDINATOR_001"
        self.communication_hub = CommunicationHub()
        self.knowledge_base = KnowledgeBase()
        self.logger = AITeamLogger("TestingCoordinator")
        
        # Testing state
        self.agents: Dict[str, TestingAgent] = {}
        self.scenarios: Dict[str, TestingScenario] = {}
        self.current_phase = TestPhase.SETUP
        self.start_time = None
        self.results: Dict = {}
        
        # Load configuration
        self.load_testing_plan()
        
    def load_testing_plan(self):
        """Load the testing coordination plan"""
        try:
            plan_path = os.path.join(os.path.dirname(__file__), "user-testing-coordination-plan.json")
            with open(plan_path, 'r') as f:
                self.plan = json.load(f)["testing_coordination_plan"]
                
            # Initialize scenarios
            for scenario_id, scenario_data in self.plan["testing_scenarios"].items():
                self.scenarios[scenario_data["scenario_id"]] = TestingScenario(
                    scenario_id=scenario_data["scenario_id"],
                    name=scenario_data["name"],
                    duration_minutes=int(scenario_data["duration"].split()[0]),
                    tasks=scenario_data["tasks"],
                    assigned_agents=[]
                )
                
            self.logger.info(f"Loaded testing plan with {len(self.scenarios)} scenarios")
            
        except Exception as e:
            self.logger.error(f"Failed to load testing plan: {e}")
            raise

    async def register_with_communication_hub(self):
        """Register coordinator with the communication hub"""
        await self.communication_hub.register_agent(
            agent_id=self.coordinator_id,
            agent_type="COORDINATOR",
            capabilities=["testing_coordination", "agent_management", "data_aggregation"]
        )
        
        # Subscribe to all message types
        await self.communication_hub.subscribe(
            agent_id=self.coordinator_id,
            message_types=[MessageType.STATUS_UPDATE, MessageType.HELP_REQUEST, 
                          MessageType.TASK_COMPLETION, MessageType.COLLABORATION_REQUEST]
        )
        
        self.logger.info(f"Coordinator {self.coordinator_id} registered with CommunicationHub")

    async def create_testing_agents(self):
        """Create and register all testing agents"""
        personas = self.generate_user_personas()
        
        for category, category_data in self.plan["agent_distribution"]["categories"].items():
            for i in range(category_data["count"]):
                agent_id = f"{category.upper()}_{i+1:03d}"
                
                # Create agent persona
                persona = personas[category][i % len(personas[category])]
                
                # Create testing agent
                agent = TestingAgent(
                    agent_id=agent_id,
                    category=category,
                    persona=persona,
                    status=AgentStatus.REGISTERED
                )
                
                self.agents[agent_id] = agent
                
                # Register with communication hub
                await self.communication_hub.register_agent(
                    agent_id=agent_id,
                    agent_type="TESTER",
                    capabilities=category_data["focus_areas"]
                )
        
        self.logger.info(f"Created and registered {len(self.agents)} testing agents")

    def generate_user_personas(self) -> Dict[str, List[Dict]]:
        """Generate diverse user personas for each category"""
        personas = {
            "digital_artists": [
                {"name": "Maya", "experience": "professional", "tools": ["Photoshop", "Illustrator"], "focus": "commercial patterns"},
                {"name": "Alex", "experience": "hobbyist", "tools": ["GIMP", "Inkscape"], "focus": "personal projects"},
                {"name": "Jordan", "experience": "intermediate", "tools": ["Procreate", "Affinity"], "focus": "textile design"},
                {"name": "Sam", "experience": "beginner", "tools": ["Canva"], "focus": "social media graphics"},
                {"name": "Casey", "experience": "expert", "tools": ["Adobe Creative Suite"], "focus": "brand identity"},
            ],
            "web_developers": [
                {"name": "Chris", "experience": "senior", "languages": ["JavaScript", "Python"], "focus": "full-stack development"},
                {"name": "Taylor", "experience": "junior", "languages": ["HTML", "CSS", "JS"], "focus": "frontend development"},
                {"name": "Morgan", "experience": "intermediate", "languages": ["React", "Node.js"], "focus": "web applications"},
                {"name": "Riley", "experience": "expert", "languages": ["TypeScript", "Go"], "focus": "system architecture"},
            ],
            "educators": [
                {"name": "Dr. Smith", "level": "university", "subject": "Computer Science", "focus": "algorithm visualization"},
                {"name": "Ms. Johnson", "level": "high_school", "subject": "Art", "focus": "digital art education"},
                {"name": "Prof. Lee", "level": "college", "subject": "Design", "focus": "pattern theory"},
            ],
            "students": [
                {"name": "Emma", "level": "high_school", "interest": "digital art", "experience": "beginner"},
                {"name": "Liam", "level": "college", "interest": "web development", "experience": "intermediate"},
                {"name": "Sofia", "level": "university", "interest": "computer graphics", "experience": "advanced"},
                {"name": "Noah", "level": "middle_school", "interest": "coding", "experience": "beginner"},
            ],
            "ux_ui_designers": [
                {"name": "Avery", "experience": "senior", "tools": ["Figma", "Sketch"], "focus": "user experience"},
                {"name": "Quinn", "experience": "mid-level", "tools": ["Adobe XD"], "focus": "visual design"},
            ],
            "cultural_researchers": [
                {"name": "Dr. Patel", "field": "anthropology", "focus": "geometric patterns in Islamic art"},
                {"name": "Prof. Wang", "field": "art history", "focus": "traditional Chinese patterns"},
            ]
        }
        
        return personas

    async def assign_scenarios_to_agents(self):
        """Assign testing scenarios to appropriate agents"""
        scenario_assignments = {
            "S001": list(self.agents.keys())[:60],  # Onboarding - mixed sample
            "S002": [aid for aid in self.agents.keys() if aid.startswith(("ARTIST_", "DESIGNER_"))],
            "S003": [aid for aid in self.agents.keys() if aid.startswith(("DEVELOPER_", "DESIGNER_"))],
            "S004": list(self.agents.keys())[::2],  # Every other agent
            "S005": [aid for aid in self.agents.keys() if aid.startswith(("DEVELOPER_", "ARTIST_"))],
            "S006": list(self.agents.keys())[::3],  # Every third agent
            "S007": [aid for aid in self.agents.keys() if aid.startswith(("EDUCATOR_", "STUDENT_"))],
            "S008": [aid for aid in self.agents.keys() if aid.startswith(("EDUCATOR_", "STUDENT_"))],
        }
        
        for scenario_id, assigned_agents in scenario_assignments.items():
            if scenario_id in self.scenarios:
                self.scenarios[scenario_id].assigned_agents = assigned_agents
                
                # Notify agents of assignment
                for agent_id in assigned_agents:
                    await self.communication_hub.send_message(
                        sender_id=self.coordinator_id,
                        recipient_id=agent_id,
                        message_type=MessageType.TASK_ASSIGNMENT,
                        content={
                            "scenario_id": scenario_id,
                            "scenario_name": self.scenarios[scenario_id].name,
                            "tasks": self.scenarios[scenario_id].tasks,
                            "estimated_duration": self.scenarios[scenario_id].duration_minutes,
                            "start_time": "await_coordinator_signal"
                        }
                    )
        
        self.logger.info("Assigned scenarios to agents")

    async def execute_testing_phase(self, phase: TestPhase):
        """Execute a specific testing phase"""
        self.current_phase = phase
        self.logger.info(f"Starting testing phase: {phase.value}")
        
        # Broadcast phase start
        await self.communication_hub.broadcast_message(
            sender_id=self.coordinator_id,
            message_type=MessageType.STATUS_UPDATE,
            content={
                "phase": phase.value,
                "status": "starting",
                "timestamp": datetime.now().isoformat()
            }
        )
        
        if phase == TestPhase.ONBOARDING:
            await self.execute_onboarding_phase()
        elif phase == TestPhase.CORE_FEATURES:
            await self.execute_core_features_phase()
        elif phase == TestPhase.SPECIALIZED:
            await self.execute_specialized_phase()
        elif phase == TestPhase.EDGE_CASES:
            await self.execute_edge_cases_phase()
        elif phase == TestPhase.ANALYSIS:
            await self.execute_analysis_phase()
            
        self.logger.info(f"Completed testing phase: {phase.value}")

    async def execute_onboarding_phase(self):
        """Execute the onboarding phase"""
        # Start S001 scenario for selected agents
        scenario = self.scenarios["S001"]
        scenario.start_time = datetime.now()
        scenario.status = "active"
        
        # Signal agents to start
        for agent_id in scenario.assigned_agents:
            await self.communication_hub.send_message(
                sender_id=self.coordinator_id,
                recipient_id=agent_id,
                message_type=MessageType.TASK_ASSIGNMENT,
                content={
                    "action": "start_scenario",
                    "scenario_id": "S001",
                    "start_time": scenario.start_time.isoformat()
                }
            )
            
            # Update agent status
            if agent_id in self.agents:
                self.agents[agent_id].status = AgentStatus.ACTIVE
                self.agents[agent_id].current_scenario = "S001"
        
        # Wait for completion or timeout
        await self.monitor_scenario_progress("S001", timeout_minutes=35)

    async def execute_core_features_phase(self):
        """Execute core features testing with parallel tracks"""
        # Track A: S002 (Pattern Creation)
        # Track B: S003 (Code Generation)
        
        scenarios_to_run = ["S002", "S003"]
        
        # Start scenarios in parallel
        tasks = []
        for scenario_id in scenarios_to_run:
            task = asyncio.create_task(self.run_scenario(scenario_id))
            tasks.append(task)
        
        # Wait for all scenarios to complete
        await asyncio.gather(*tasks)

    async def execute_specialized_phase(self):
        """Execute specialized testing scenarios"""
        scenarios_to_run = ["S004", "S005", "S006"]
        
        # Run scenarios in parallel
        tasks = []
        for scenario_id in scenarios_to_run:
            task = asyncio.create_task(self.run_scenario(scenario_id))
            tasks.append(task)
        
        await asyncio.gather(*tasks)

    async def execute_edge_cases_phase(self):
        """Execute edge cases and accessibility testing"""
        scenarios_to_run = ["S007", "S008"]
        
        tasks = []
        for scenario_id in scenarios_to_run:
            task = asyncio.create_task(self.run_scenario(scenario_id))
            tasks.append(task)
        
        await asyncio.gather(*tasks)

    async def run_scenario(self, scenario_id: str):
        """Run a specific testing scenario"""
        scenario = self.scenarios[scenario_id]
        scenario.start_time = datetime.now()
        scenario.status = "active"
        
        self.logger.info(f"Starting scenario {scenario_id}: {scenario.name}")
        
        # Signal agents to start
        for agent_id in scenario.assigned_agents:
            await self.communication_hub.send_message(
                sender_id=self.coordinator_id,
                recipient_id=agent_id,
                message_type=MessageType.TASK_ASSIGNMENT,
                content={
                    "action": "start_scenario",
                    "scenario_id": scenario_id,
                    "start_time": scenario.start_time.isoformat()
                }
            )
            
            # Update agent status
            if agent_id in self.agents:
                self.agents[agent_id].status = AgentStatus.ACTIVE
                self.agents[agent_id].current_scenario = scenario_id
        
        # Monitor progress
        await self.monitor_scenario_progress(scenario_id, timeout_minutes=scenario.duration_minutes + 10)
        
        scenario.status = "completed"
        self.logger.info(f"Completed scenario {scenario_id}")

    async def monitor_scenario_progress(self, scenario_id: str, timeout_minutes: int):
        """Monitor progress of a scenario"""
        start_time = datetime.now()
        timeout_time = start_time + timedelta(minutes=timeout_minutes)
        
        while datetime.now() < timeout_time:
            # Check completion status
            completed_agents = 0
            total_agents = len(self.scenarios[scenario_id].assigned_agents)
            
            for agent_id in self.scenarios[scenario_id].assigned_agents:
                if agent_id in self.agents:
                    agent = self.agents[agent_id]
                    if scenario_id in agent.completed_scenarios:
                        completed_agents += 1
            
            completion_rate = completed_agents / total_agents if total_agents > 0 else 0
            self.scenarios[scenario_id].completion_rate = completion_rate
            
            # Log progress
            self.logger.info(f"Scenario {scenario_id} progress: {completion_rate:.1%} ({completed_agents}/{total_agents})")
            
            # Check if completed
            if completion_rate >= 0.9:  # 90% completion threshold
                break
                
            # Wait before next check
            await asyncio.sleep(30)  # Check every 30 seconds
        
        # Final status update
        final_completion = self.scenarios[scenario_id].completion_rate
        self.logger.info(f"Scenario {scenario_id} final completion: {final_completion:.1%}")

    async def execute_analysis_phase(self):
        """Execute data analysis and report generation"""
        self.logger.info("Starting analysis phase")
        
        # Collect all agent data
        agent_data = {}
        for agent_id, agent in self.agents.items():
            agent_data[agent_id] = {
                "category": agent.category,
                "persona": agent.persona,
                "completed_scenarios": agent.completed_scenarios,
                "metrics": agent.metrics,
                "status": agent.status.value
            }
        
        # Aggregate scenario results
        scenario_results = {}
        for scenario_id, scenario in self.scenarios.items():
            scenario_results[scenario_id] = {
                "name": scenario.name,
                "completion_rate": scenario.completion_rate,
                "assigned_agents": len(scenario.assigned_agents),
                "duration_minutes": scenario.duration_minutes,
                "status": scenario.status
            }
        
        # Generate comprehensive report
        report = {
            "testing_session": {
                "start_time": self.start_time.isoformat() if self.start_time else None,
                "end_time": datetime.now().isoformat(),
                "total_duration_hours": (datetime.now() - self.start_time).total_seconds() / 3600 if self.start_time else 0,
                "total_agents": len(self.agents),
                "total_scenarios": len(self.scenarios)
            },
            "agent_results": agent_data,
            "scenario_results": scenario_results,
            "summary": {
                "overall_completion_rate": sum(s.completion_rate for s in self.scenarios.values()) / len(self.scenarios),
                "active_agents": len([a for a in self.agents.values() if a.status == AgentStatus.ACTIVE]),
                "completed_agents": len([a for a in self.agents.values() if a.status == AgentStatus.COMPLETED]),
                "error_agents": len([a for a in self.agents.values() if a.status == AgentStatus.ERROR])
            }
        }
        
        # Save report
        report_path = f"/Users/homeserver/ai-creative-team/projects/genshi-studio/testing/results/testing_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        os.makedirs(os.path.dirname(report_path), exist_ok=True)
        
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        # Store in knowledge base
        await self.knowledge_base.store_document(
            collection_name="testing_results",
            document_id=f"genshi_studio_testing_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            content=json.dumps(report),
            metadata={
                "project": "genshi-studio",
                "test_type": "user_simulation",
                "agent_count": len(self.agents),
                "scenario_count": len(self.scenarios)
            }
        )
        
        self.logger.info(f"Analysis complete. Report saved to {report_path}")

    async def handle_agent_message(self, message):
        """Handle incoming messages from testing agents"""
        sender_id = message.get("sender_id")
        message_type = message.get("message_type")
        content = message.get("content", {})
        
        if sender_id in self.agents:
            agent = self.agents[sender_id]
            
            if message_type == MessageType.STATUS_UPDATE:
                # Update agent status
                if "status" in content:
                    agent.status = AgentStatus(content["status"])
                    
                if "current_scenario" in content:
                    agent.current_scenario = content["current_scenario"]
                    
                if "metrics" in content:
                    agent.metrics.update(content["metrics"])
                    
                agent.last_update = datetime.now()
                
            elif message_type == MessageType.TASK_COMPLETION:
                # Mark scenario as completed for agent
                scenario_id = content.get("scenario_id")
                if scenario_id and scenario_id not in agent.completed_scenarios:
                    agent.completed_scenarios.append(scenario_id)
                    
                # Check if agent completed all assigned scenarios
                assigned_scenarios = [s for s in self.scenarios.values() if sender_id in s.assigned_agents]
                if len(agent.completed_scenarios) >= len(assigned_scenarios):
                    agent.status = AgentStatus.COMPLETED
                    
            elif message_type == MessageType.HELP_REQUEST:
                # Handle help requests
                await self.handle_help_request(sender_id, content)
        
        # Log message
        self.logger.debug(f"Processed message from {sender_id}: {message_type}")

    async def handle_help_request(self, agent_id: str, content: Dict):
        """Handle help requests from agents"""
        help_type = content.get("help_type", "general")
        
        if help_type == "technical_issue":
            # Escalate technical issues
            await self.communication_hub.send_message(
                sender_id=self.coordinator_id,
                recipient_id=agent_id,
                message_type=MessageType.COLLABORATION_REQUEST,
                content={
                    "response": "technical_support",
                    "instructions": "Please provide detailed error information and steps to reproduce",
                    "escalation": "coordinator_review"
                }
            )
        elif help_type == "scenario_clarification":
            # Provide scenario clarification
            scenario_id = content.get("scenario_id")
            if scenario_id in self.scenarios:
                scenario = self.scenarios[scenario_id]
                await self.communication_hub.send_message(
                    sender_id=self.coordinator_id,
                    recipient_id=agent_id,
                    message_type=MessageType.KNOWLEDGE_SHARE,
                    content={
                        "scenario_details": {
                            "name": scenario.name,
                            "tasks": scenario.tasks,
                            "duration": scenario.duration_minutes,
                            "success_criteria": "Complete all tasks with user feedback"
                        }
                    }
                )
        
        self.logger.info(f"Handled help request from {agent_id}: {help_type}")

    async def run_complete_testing_cycle(self):
        """Run the complete testing cycle"""
        try:
            self.start_time = datetime.now()
            self.logger.info("Starting complete user testing cycle")
            
            # Phase 1: Setup
            await self.register_with_communication_hub()
            await self.create_testing_agents()
            await self.assign_scenarios_to_agents()
            
            # Phase 2: Onboarding
            await self.execute_testing_phase(TestPhase.ONBOARDING)
            
            # Phase 3: Core Features
            await self.execute_testing_phase(TestPhase.CORE_FEATURES)
            
            # Phase 4: Specialized Testing
            await self.execute_testing_phase(TestPhase.SPECIALIZED)
            
            # Phase 5: Edge Cases
            await self.execute_testing_phase(TestPhase.EDGE_CASES)
            
            # Phase 6: Analysis
            await self.execute_testing_phase(TestPhase.ANALYSIS)
            
            # Mark as complete
            self.current_phase = TestPhase.COMPLETE
            
            self.logger.info("Complete user testing cycle finished successfully")
            
        except Exception as e:
            self.logger.error(f"Error in testing cycle: {e}")
            raise

    async def get_testing_status(self) -> Dict:
        """Get current testing status"""
        return {
            "current_phase": self.current_phase.value,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "agents": {
                "total": len(self.agents),
                "active": len([a for a in self.agents.values() if a.status == AgentStatus.ACTIVE]),
                "completed": len([a for a in self.agents.values() if a.status == AgentStatus.COMPLETED]),
                "error": len([a for a in self.agents.values() if a.status == AgentStatus.ERROR])
            },
            "scenarios": {
                "total": len(self.scenarios),
                "active": len([s for s in self.scenarios.values() if s.status == "active"]),
                "completed": len([s for s in self.scenarios.values() if s.status == "completed"])
            }
        }

if __name__ == "__main__":
    async def main():
        coordinator = TestingCoordinator()
        await coordinator.run_complete_testing_cycle()
        
        # Print final status
        status = await coordinator.get_testing_status()
        print(json.dumps(status, indent=2))
    
    asyncio.run(main())