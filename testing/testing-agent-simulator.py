#!/usr/bin/env python3
"""
Genshi Studio Testing Agent Simulator
Simulates user personas performing testing scenarios
"""

import asyncio
import json
import random
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum

# AI Creative Team System imports
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'src'))

from core.agent_communication_hub import CommunicationHub, MessageType
from core.ai_team_logger import AITeamLogger

class TaskResult(Enum):
    SUCCESS = "success"
    PARTIAL = "partial"
    FAILURE = "failure"
    BLOCKED = "blocked"

@dataclass
class TestingTask:
    task_id: str
    description: str
    estimated_duration: int  # seconds
    complexity: str  # low, medium, high
    success_criteria: List[str]

@dataclass
class TaskExecution:
    task: TestingTask
    start_time: datetime
    end_time: Optional[datetime] = None
    result: Optional[TaskResult] = None
    feedback: Optional[str] = None
    metrics: Dict = None
    
    def __post_init__(self):
        if self.metrics is None:
            self.metrics = {}

class TestingAgentSimulator:
    def __init__(self, agent_id: str, category: str, persona: Dict):
        self.agent_id = agent_id
        self.category = category
        self.persona = persona
        self.communication_hub = CommunicationHub()
        self.logger = AITeamLogger(f"TestingAgent_{agent_id}")
        
        # Agent state
        self.current_scenario = None
        self.task_executions: List[TaskExecution] = []
        self.session_metrics = {
            "total_tasks": 0,
            "successful_tasks": 0,
            "failed_tasks": 0,
            "total_time": 0,
            "bugs_found": 0,
            "usability_issues": 0,
            "satisfaction_score": 0
        }
        
        # Persona-specific behavior
        self.setup_persona_behavior()
        
    def setup_persona_behavior(self):
        """Setup behavior patterns based on persona"""
        self.behavior = {
            "patience_level": random.uniform(0.3, 1.0),
            "technical_skill": self.get_technical_skill_level(),
            "error_tolerance": random.uniform(0.2, 0.8),
            "exploration_tendency": random.uniform(0.4, 0.9),
            "feedback_verbosity": random.uniform(0.3, 0.9)
        }
        
    def get_technical_skill_level(self) -> float:
        """Get technical skill level based on persona"""
        if self.category == "web_developers":
            return random.uniform(0.7, 1.0)
        elif self.category == "digital_artists":
            return random.uniform(0.4, 0.8)
        elif self.category == "ux_ui_designers":
            return random.uniform(0.6, 0.9)
        elif self.category == "educators":
            return random.uniform(0.5, 0.8)
        elif self.category == "students":
            return random.uniform(0.2, 0.7)
        elif self.category == "cultural_researchers":
            return random.uniform(0.3, 0.6)
        else:
            return random.uniform(0.3, 0.7)

    async def register_with_hub(self):
        """Register with communication hub"""
        await self.communication_hub.register_agent(
            agent_id=self.agent_id,
            agent_type="TESTER",
            capabilities=[self.category, "user_simulation", "feedback_generation"]
        )
        
        # Subscribe to messages
        await self.communication_hub.subscribe(
            agent_id=self.agent_id,
            message_types=[MessageType.TASK_ASSIGNMENT, MessageType.KNOWLEDGE_SHARE]
        )
        
        self.logger.info(f"Agent {self.agent_id} registered with CommunicationHub")

    async def listen_for_assignments(self):
        """Listen for task assignments from coordinator"""
        while True:
            try:
                messages = await self.communication_hub.get_messages(self.agent_id)
                
                for message in messages:
                    await self.handle_message(message)
                    
                await asyncio.sleep(5)  # Check every 5 seconds
                
            except Exception as e:
                self.logger.error(f"Error listening for assignments: {e}")
                await asyncio.sleep(10)

    async def handle_message(self, message: Dict):
        """Handle incoming messages"""
        message_type = message.get("message_type")
        content = message.get("content", {})
        
        if message_type == MessageType.TASK_ASSIGNMENT:
            if content.get("action") == "start_scenario":
                scenario_id = content.get("scenario_id")
                await self.start_scenario(scenario_id)
            else:
                # Regular task assignment
                await self.handle_task_assignment(content)
                
        elif message_type == MessageType.KNOWLEDGE_SHARE:
            # Process shared knowledge
            await self.process_knowledge_share(content)

    async def handle_task_assignment(self, content: Dict):
        """Handle task assignment"""
        scenario_id = content.get("scenario_id")
        tasks = content.get("tasks", [])
        
        if scenario_id:
            self.current_scenario = scenario_id
            self.logger.info(f"Assigned to scenario {scenario_id} with {len(tasks)} tasks")
            
            # Send acknowledgment
            await self.communication_hub.send_message(
                sender_id=self.agent_id,
                recipient_id="COORDINATOR_001",
                message_type=MessageType.STATUS_UPDATE,
                content={
                    "status": "task_received",
                    "scenario_id": scenario_id,
                    "estimated_start": datetime.now().isoformat()
                }
            )

    async def start_scenario(self, scenario_id: str):
        """Start executing a testing scenario"""
        self.logger.info(f"Starting scenario {scenario_id}")
        
        # Update status
        await self.communication_hub.send_message(
            sender_id=self.agent_id,
            recipient_id="COORDINATOR_001",
            message_type=MessageType.STATUS_UPDATE,
            content={
                "status": "active",
                "current_scenario": scenario_id,
                "start_time": datetime.now().isoformat()
            }
        )
        
        # Execute scenario tasks
        await self.execute_scenario_tasks(scenario_id)
        
        # Complete scenario
        await self.complete_scenario(scenario_id)

    async def execute_scenario_tasks(self, scenario_id: str):
        """Execute tasks for a specific scenario"""
        scenario_tasks = self.get_scenario_tasks(scenario_id)
        
        for task in scenario_tasks:
            task_execution = TaskExecution(
                task=task,
                start_time=datetime.now()
            )
            
            # Execute task
            await self.execute_task(task_execution)
            
            # Store execution
            self.task_executions.append(task_execution)
            
            # Update metrics
            self.update_session_metrics(task_execution)
            
            # Send progress update
            await self.send_progress_update(task_execution)

    def get_scenario_tasks(self, scenario_id: str) -> List[TestingTask]:
        """Get tasks for a specific scenario"""
        task_definitions = {
            "S001": [  # First-Time User Experience
                TestingTask("landing_page", "Comprehend landing page content", 120, "low", ["Understand main purpose", "Identify key features"]),
                TestingTask("account_creation", "Create user account", 180, "medium", ["Complete registration", "Verify email"]),
                TestingTask("initial_tutorial", "Complete initial tutorial", 300, "medium", ["Follow all steps", "Complete first pattern"]),
                TestingTask("feature_discovery", "Discover key features", 240, "high", ["Find main tools", "Understand navigation"]),
            ],
            "S002": [  # Pattern Creation Workflows
                TestingTask("manual_drawing", "Draw pattern manually", 360, "medium", ["Create basic shape", "Apply symmetry"]),
                TestingTask("symmetry_tools", "Use symmetry tools", 240, "medium", ["Apply different symmetries", "Adjust parameters"]),
                TestingTask("color_palette", "Select and apply colors", 180, "low", ["Choose colors", "Apply to pattern"]),
                TestingTask("pattern_modification", "Modify existing pattern", 300, "high", ["Edit shapes", "Change properties"]),
                TestingTask("save_organize", "Save and organize patterns", 120, "low", ["Save pattern", "Organize in collections"]),
            ],
            "S003": [  # Code-Based Pattern Generation
                TestingTask("code_editor", "Use code editor", 240, "high", ["Write basic code", "Understand syntax"]),
                TestingTask("algorithm_implementation", "Implement pattern algorithm", 480, "high", ["Create algorithm", "Debug code"]),
                TestingTask("parameter_adjustment", "Adjust parameters", 180, "medium", ["Modify variables", "See real-time changes"]),
                TestingTask("real_time_preview", "Use real-time preview", 120, "low", ["See changes", "Understand updates"]),
                TestingTask("code_export", "Export code", 60, "low", ["Generate code", "Download files"]),
            ],
            "S004": [  # Growth Studio Exploration
                TestingTask("navigate_growth", "Navigate growth patterns", 200, "medium", ["Browse patterns", "Understand categories"]),
                TestingTask("understand_parameters", "Understand growth parameters", 300, "high", ["Learn parameters", "See effects"]),
                TestingTask("custom_growth", "Create custom growth rules", 420, "high", ["Define rules", "Test behavior"]),
                TestingTask("animate_patterns", "Animate patterns", 240, "medium", ["Create animation", "Control timing"]),
                TestingTask("share_creations", "Share creations", 120, "low", ["Export", "Share with others"]),
            ],
            "S005": [  # Export and Integration
                TestingTask("export_png_svg", "Export to PNG/SVG", 120, "low", ["Export files", "Check quality"]),
                TestingTask("code_export_validation", "Validate code export", 180, "medium", ["Export code", "Test in external tool"]),
                TestingTask("resolution_testing", "Test different resolutions", 240, "medium", ["Export various sizes", "Check quality"]),
                TestingTask("file_size_optimization", "Check file size optimization", 180, "medium", ["Compare sizes", "Optimize settings"]),
                TestingTask("external_integration", "Test external tool integration", 300, "high", ["Use in other apps", "Check compatibility"]),
            ],
            "S006": [  # Cross-Platform Compatibility
                TestingTask("browser_compatibility", "Test browser compatibility", 360, "medium", ["Test multiple browsers", "Check functionality"]),
                TestingTask("mobile_responsiveness", "Test mobile responsiveness", 300, "high", ["Use on mobile", "Check layout"]),
                TestingTask("tablet_optimization", "Test tablet optimization", 240, "medium", ["Use on tablet", "Check touch interface"]),
                TestingTask("touch_gestures", "Test touch gesture support", 180, "medium", ["Use gestures", "Check responsiveness"]),
                TestingTask("performance_testing", "Test performance on different devices", 300, "high", ["Measure speed", "Check resource usage"]),
            ],
            "S007": [  # Accessibility Testing
                TestingTask("screen_reader", "Test screen reader compatibility", 360, "high", ["Use screen reader", "Check content access"]),
                TestingTask("keyboard_navigation", "Test keyboard navigation", 240, "medium", ["Navigate with keyboard", "Check all functions"]),
                TestingTask("color_contrast", "Validate color contrast", 180, "low", ["Check contrast ratios", "Test with tools"]),
                TestingTask("alt_text", "Check alternative text presence", 120, "low", ["Verify alt text", "Check descriptions"]),
                TestingTask("wcag_compliance", "Check WCAG compliance", 300, "high", ["Run compliance tools", "Document issues"]),
            ],
            "S008": [  # Educational Features
                TestingTask("tutorial_effectiveness", "Evaluate tutorial effectiveness", 300, "medium", ["Complete tutorials", "Rate clarity"]),
                TestingTask("help_documentation", "Review help documentation", 240, "medium", ["Read documentation", "Find answers"]),
                TestingTask("example_projects", "Explore example projects", 180, "low", ["View examples", "Learn from them"]),
                TestingTask("learning_path", "Follow learning path", 420, "high", ["Complete path", "Track progress"]),
                TestingTask("knowledge_retention", "Assess knowledge retention", 300, "high", ["Test understanding", "Apply concepts"]),
            ],
        }
        
        return task_definitions.get(scenario_id, [])

    async def execute_task(self, task_execution: TaskExecution):
        """Execute a specific task"""
        task = task_execution.task
        
        # Simulate task execution time based on complexity and persona
        base_time = task.estimated_duration
        skill_modifier = self.behavior["technical_skill"]
        patience_modifier = self.behavior["patience_level"]
        
        # Adjust execution time based on persona
        actual_time = base_time * (1.0 + (1.0 - skill_modifier) * 0.5) * (1.0 + (1.0 - patience_modifier) * 0.3)
        
        # Add random variation
        actual_time *= random.uniform(0.8, 1.4)
        
        # Simulate execution
        await asyncio.sleep(min(actual_time / 60, 30))  # Cap at 30 seconds for simulation
        
        # Determine task result based on persona and task complexity
        result = self.determine_task_result(task)
        
        # Generate feedback
        feedback = self.generate_task_feedback(task, result)
        
        # Complete task execution
        task_execution.end_time = datetime.now()
        task_execution.result = result
        task_execution.feedback = feedback
        task_execution.metrics = self.generate_task_metrics(task, result, actual_time)
        
        self.logger.info(f"Completed task {task.task_id}: {result.value}")

    def determine_task_result(self, task: TestingTask) -> TaskResult:
        """Determine task result based on persona and task complexity"""
        skill_level = self.behavior["technical_skill"]
        patience_level = self.behavior["patience_level"]
        
        # Calculate success probability
        if task.complexity == "low":
            base_probability = 0.9
        elif task.complexity == "medium":
            base_probability = 0.7
        else:  # high
            base_probability = 0.5
            
        # Adjust based on persona
        skill_adjustment = skill_level * 0.3
        patience_adjustment = patience_level * 0.2
        
        success_probability = base_probability + skill_adjustment + patience_adjustment
        
        # Determine result
        rand = random.random()
        if rand < success_probability:
            return TaskResult.SUCCESS
        elif rand < success_probability + 0.2:
            return TaskResult.PARTIAL
        elif rand < success_probability + 0.35:
            return TaskResult.BLOCKED
        else:
            return TaskResult.FAILURE

    def generate_task_feedback(self, task: TestingTask, result: TaskResult) -> str:
        """Generate feedback for a task"""
        feedback_templates = {
            TaskResult.SUCCESS: [
                "Task completed successfully. The interface was intuitive and easy to use.",
                "Great experience! Everything worked as expected.",
                "Smooth workflow. No issues encountered.",
                "Excellent functionality. Very user-friendly."
            ],
            TaskResult.PARTIAL: [
                "Task mostly completed, but encountered some minor issues.",
                "Got the job done, but the process could be smoother.",
                "Achieved the goal with some workarounds needed.",
                "Functional but not ideal. Some improvements needed."
            ],
            TaskResult.BLOCKED: [
                "Unable to complete due to technical issues.",
                "Encountered a blocking error that prevented completion.",
                "The feature seems to be broken or unavailable.",
                "System error prevented task completion."
            ],
            TaskResult.FAILURE: [
                "Could not figure out how to complete this task.",
                "The interface was confusing and difficult to navigate.",
                "Task requirements were unclear or interface was broken.",
                "Failed to complete despite multiple attempts."
            ]
        }
        
        base_feedback = random.choice(feedback_templates[result])
        
        # Add persona-specific details
        if self.behavior["feedback_verbosity"] > 0.7:
            additional_details = self.generate_detailed_feedback(task, result)
            base_feedback += f" {additional_details}"
            
        return base_feedback

    def generate_detailed_feedback(self, task: TestingTask, result: TaskResult) -> str:
        """Generate detailed feedback based on persona"""
        if self.category == "web_developers":
            return "From a technical perspective, the implementation could be optimized for better performance."
        elif self.category == "digital_artists":
            return "The creative tools are powerful but need better visual feedback for artistic workflows."
        elif self.category == "ux_ui_designers":
            return "The user experience could be enhanced with clearer visual hierarchy and better interaction patterns."
        elif self.category == "educators":
            return "This would be useful for educational purposes but needs clearer instructions for students."
        elif self.category == "students":
            return "As a student, I found this challenging but would benefit from more guidance and examples."
        elif self.category == "cultural_researchers":
            return "The historical accuracy and cultural context could be better documented and explained."
        else:
            return "Additional context and help would make this more accessible."

    def generate_task_metrics(self, task: TestingTask, result: TaskResult, execution_time: float) -> Dict:
        """Generate metrics for a task"""
        metrics = {
            "execution_time": execution_time,
            "complexity": task.complexity,
            "result": result.value,
            "user_satisfaction": self.calculate_satisfaction_score(result),
            "difficulty_rating": self.calculate_difficulty_rating(task, result),
            "would_recommend": result in [TaskResult.SUCCESS, TaskResult.PARTIAL]
        }
        
        # Add persona-specific metrics
        if self.category == "web_developers":
            metrics["code_quality_rating"] = random.randint(3, 5) if result == TaskResult.SUCCESS else random.randint(1, 3)
        elif self.category == "digital_artists":
            metrics["creative_flexibility_rating"] = random.randint(3, 5) if result == TaskResult.SUCCESS else random.randint(1, 3)
        elif self.category == "ux_ui_designers":
            metrics["usability_rating"] = random.randint(3, 5) if result == TaskResult.SUCCESS else random.randint(1, 3)
            
        return metrics

    def calculate_satisfaction_score(self, result: TaskResult) -> float:
        """Calculate satisfaction score based on result"""
        if result == TaskResult.SUCCESS:
            return random.uniform(4.0, 5.0)
        elif result == TaskResult.PARTIAL:
            return random.uniform(3.0, 4.0)
        elif result == TaskResult.BLOCKED:
            return random.uniform(1.0, 2.5)
        else:
            return random.uniform(1.0, 2.0)

    def calculate_difficulty_rating(self, task: TestingTask, result: TaskResult) -> int:
        """Calculate difficulty rating (1-5 scale)"""
        base_difficulty = {"low": 2, "medium": 3, "high": 4}[task.complexity]
        
        if result == TaskResult.SUCCESS:
            return max(1, base_difficulty - 1)
        elif result == TaskResult.PARTIAL:
            return base_difficulty
        else:
            return min(5, base_difficulty + 1)

    def update_session_metrics(self, task_execution: TaskExecution):
        """Update session-level metrics"""
        self.session_metrics["total_tasks"] += 1
        
        if task_execution.result == TaskResult.SUCCESS:
            self.session_metrics["successful_tasks"] += 1
        elif task_execution.result in [TaskResult.FAILURE, TaskResult.BLOCKED]:
            self.session_metrics["failed_tasks"] += 1
            
        # Add execution time
        if task_execution.end_time and task_execution.start_time:
            duration = (task_execution.end_time - task_execution.start_time).total_seconds()
            self.session_metrics["total_time"] += duration
            
        # Update satisfaction score (running average)
        if task_execution.metrics:
            new_score = task_execution.metrics.get("user_satisfaction", 0)
            current_avg = self.session_metrics["satisfaction_score"]
            total_tasks = self.session_metrics["total_tasks"]
            
            self.session_metrics["satisfaction_score"] = (
                (current_avg * (total_tasks - 1) + new_score) / total_tasks
            )
            
        # Simulate bug discovery
        if task_execution.result in [TaskResult.BLOCKED, TaskResult.FAILURE]:
            if random.random() < 0.6:  # 60% chance of bug discovery
                self.session_metrics["bugs_found"] += 1
                
        # Simulate usability issue discovery
        if task_execution.result == TaskResult.PARTIAL:
            if random.random() < 0.4:  # 40% chance of usability issue
                self.session_metrics["usability_issues"] += 1

    async def send_progress_update(self, task_execution: TaskExecution):
        """Send progress update to coordinator"""
        await self.communication_hub.send_message(
            sender_id=self.agent_id,
            recipient_id="COORDINATOR_001",
            message_type=MessageType.STATUS_UPDATE,
            content={
                "task_id": task_execution.task.task_id,
                "result": task_execution.result.value,
                "feedback": task_execution.feedback,
                "metrics": task_execution.metrics,
                "session_metrics": self.session_metrics
            }
        )

    async def complete_scenario(self, scenario_id: str):
        """Complete a scenario and send final report"""
        # Generate final scenario report
        scenario_report = {
            "scenario_id": scenario_id,
            "agent_id": self.agent_id,
            "category": self.category,
            "persona": self.persona,
            "tasks_completed": len(self.task_executions),
            "success_rate": self.session_metrics["successful_tasks"] / max(1, self.session_metrics["total_tasks"]),
            "average_satisfaction": self.session_metrics["satisfaction_score"],
            "bugs_found": self.session_metrics["bugs_found"],
            "usability_issues": self.session_metrics["usability_issues"],
            "total_time": self.session_metrics["total_time"],
            "completion_time": datetime.now().isoformat()
        }
        
        # Send completion notification
        await self.communication_hub.send_message(
            sender_id=self.agent_id,
            recipient_id="COORDINATOR_001",
            message_type=MessageType.TASK_COMPLETION,
            content={
                "scenario_id": scenario_id,
                "status": "completed",
                "report": scenario_report
            }
        )
        
        # Reset for next scenario
        self.current_scenario = None
        self.task_executions = []
        self.session_metrics = {
            "total_tasks": 0,
            "successful_tasks": 0,
            "failed_tasks": 0,
            "total_time": 0,
            "bugs_found": 0,
            "usability_issues": 0,
            "satisfaction_score": 0
        }
        
        self.logger.info(f"Completed scenario {scenario_id}")

    async def process_knowledge_share(self, content: Dict):
        """Process shared knowledge from other agents"""
        if "scenario_details" in content:
            self.logger.info("Received scenario clarification from coordinator")
        elif "tips" in content:
            self.logger.info("Received tips from peer agents")

    async def run_agent_simulation(self):
        """Run the agent simulation"""
        try:
            await self.register_with_hub()
            await self.listen_for_assignments()
            
        except Exception as e:
            self.logger.error(f"Error in agent simulation: {e}")
            raise

if __name__ == "__main__":
    # Example usage
    async def main():
        # Create sample agent
        agent = TestingAgentSimulator(
            agent_id="ARTIST_001",
            category="digital_artists",
            persona={
                "name": "Maya",
                "experience": "professional",
                "tools": ["Photoshop", "Illustrator"],
                "focus": "commercial patterns"
            }
        )
        
        await agent.run_agent_simulation()
    
    asyncio.run(main())