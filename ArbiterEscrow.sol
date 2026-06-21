// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ArbiterEscrow — Agent-to-agent settlement via 0G Private Computer (TEE)
 *
 * State machine: Created → Submitted → Resolved
 *
 * Trust model: TEE attestation from 0G Private Computer replaces jury/oracle.
 * The compute operator cannot read task content; the attestation is verifiable on-chain.
 */
contract ArbiterEscrow {

    // ─── Types ───────────────────────────────────────────────────────────────

    enum Status { Created, Submitted, Resolved }

    struct Task {
        address agentA;         // task creator + escrow payer
        address agentB;         // result submitter
        uint256 escrowAmount;
        string  criteriaURI;    // acceptance criteria (stored on 0G Storage)
        string  resultURI;      // result (stored on 0G Storage)
        bytes32 resultHash;     // keccak256 of result content
        Status  status;
        bool    passed;
        uint8   score;          // 0-100
    }

    // ─── State ────────────────────────────────────────────────────────────────

    address public arbiterTEE;   // 0G Private Computer attestation relayer
    uint256 public nextTaskId;
    mapping(uint256 => Task) public tasks;

    // ─── Events ───────────────────────────────────────────────────────────────

    event TaskCreated(
        uint256 indexed taskId,
        address indexed agentA,
        address indexed agentB,
        uint256 escrowAmount,
        string  criteriaURI
    );

    event ResultSubmitted(
        uint256 indexed taskId,
        string  resultURI,
        bytes32 resultHash
    );

    event AttestationReceived(
        uint256 indexed taskId,
        bytes32 attestationHash,
        bool    passed,
        uint8   score
    );

    event TaskResolved(
        uint256 indexed taskId,
        address recipient,
        uint256 amount
    );

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address _arbiterTEE) {
        arbiterTEE = _arbiterTEE;
    }

    // ─── Core Functions ───────────────────────────────────────────────────────

    /**
     * Agent A creates a task and locks escrow.
     * criteriaURI points to acceptance criteria stored on 0G Storage.
     */
    function createTask(
        address agentB,
        string calldata criteriaURI
    ) external payable returns (uint256 taskId) {
        require(msg.value > 0, "Escrow required");
        require(agentB != address(0), "Invalid agentB");

        taskId = nextTaskId++;
        tasks[taskId] = Task({
            agentA:        msg.sender,
            agentB:        agentB,
            escrowAmount:  msg.value,
            criteriaURI:   criteriaURI,
            resultURI:     "",
            resultHash:    bytes32(0),
            status:        Status.Created,
            passed:        false,
            score:         0
        });

        emit TaskCreated(taskId, msg.sender, agentB, msg.value, criteriaURI);
    }

    /**
     * Agent B submits result.
     * resultURI points to content on 0G Storage; resultHash is keccak256 of content.
     */
    function submitResult(
        uint256 taskId,
        string calldata resultURI,
        bytes32 resultHash
    ) external {
        Task storage t = tasks[taskId];
        require(t.status == Status.Created, "Wrong status");
        require(msg.sender == t.agentB, "Only agentB");

        t.resultURI  = resultURI;
        t.resultHash = resultHash;
        t.status     = Status.Submitted;

        emit ResultSubmitted(taskId, resultURI, resultHash);
    }

    /**
     * 0G Private Computer TEE relayer posts attestation.
     * In production: attestation signature verified against 0G attestation root.
     * For MVP demo: trusted relayer address (arbiterTEE) controls this call.
     *
     * passed=true  → escrow released to agentB
     * passed=false → escrow refunded to agentA
     */
    function resolveWithAttestation(
        uint256 taskId,
        bytes32 attestationHash,
        bool    passed,
        uint8   score
    ) external {
        require(msg.sender == arbiterTEE, "Only arbiter");
        Task storage t = tasks[taskId];
        require(t.status == Status.Submitted, "Wrong status");

        t.status = Status.Resolved;
        t.passed = passed;
        t.score  = score;

        address recipient = passed ? t.agentB : t.agentA;
        uint256 amount    = t.escrowAmount;
        t.escrowAmount    = 0;

        emit AttestationReceived(taskId, attestationHash, passed, score);
        emit TaskResolved(taskId, recipient, amount);

        (bool ok, ) = recipient.call{value: amount}("");
        require(ok, "Transfer failed");
    }

    // ─── View ─────────────────────────────────────────────────────────────────

    function getTask(uint256 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }
}
